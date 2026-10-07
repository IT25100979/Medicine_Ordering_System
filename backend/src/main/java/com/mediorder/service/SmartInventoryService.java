package com.mediorder.service;

import com.mediorder.dto.*;
import com.mediorder.model.BatchStatus;
import com.mediorder.model.InventoryBatch;
import com.mediorder.model.Medicine;
import com.mediorder.repository.InventoryBatchRepository;
import com.mediorder.repository.MedicineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SmartInventoryService {

    private final InventoryBatchRepository batchRepository;
    private final MedicineRepository medicineRepository;

    public SmartInventoryService(InventoryBatchRepository batchRepository, MedicineRepository medicineRepository) {
        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
    }

    /**
     * Retrieve all batches ordered strictly by FEFO (Earliest Expiry First),
     * applying real-time expiry and near-expiry state evaluations.
     */
    @Transactional
    public List<BatchResponse> getAllBatches(String search, BatchStatus statusFilter, String urgencyFilter) {
        List<InventoryBatch> rawBatches;

        if (search != null && !search.trim().isEmpty()) {
            rawBatches = batchRepository.searchBatchesOrderByFefo(search.trim());
        } else {
            rawBatches = batchRepository.findAllByOrderByExpiryDateAsc();
        }

        LocalDate today = LocalDate.now();
        boolean hasStateChanges = false;

        // Auto-evaluate batch status based on calendar dates
        for (InventoryBatch batch : rawBatches) {
            if (batch.getExpiryDate() != null) {
                if (today.isAfter(batch.getExpiryDate()) && batch.getStatus() != BatchStatus.EXPIRED && batch.getStatus() != BatchStatus.QUARANTINED) {
                    batch.setStatus(BatchStatus.EXPIRED);
                    hasStateChanges = true;
                } else if (!today.isAfter(batch.getExpiryDate()) &&
                           ChronoUnit.DAYS.between(today, batch.getExpiryDate()) <= 30 &&
                           batch.getStatus() == BatchStatus.ACTIVE) {
                    batch.setStatus(BatchStatus.NEAR_EXPIRY);
                    hasStateChanges = true;
                }
            }
        }

        if (hasStateChanges) {
            batchRepository.saveAll(rawBatches);
        }

        // Group by medicine to calculate FEFO rank per medicine
        Map<Long, Integer> medicineRankCounter = new HashMap<>();

        return rawBatches.stream()
                .filter(b -> statusFilter == null || b.getStatus() == statusFilter)
                .map(b -> {
                    long days = ChronoUnit.DAYS.between(today, b.getExpiryDate());
                    String urgency;
                    if (days < 0 || b.getStatus() == BatchStatus.EXPIRED) {
                        urgency = "EXPIRED";
                    } else if (days <= 30) {
                        urgency = "CRITICAL_FEFO";
                    } else if (days <= 90) {
                        urgency = "MODERATE";
                    } else {
                        urgency = "SAFE";
                    }

                    int rank = 0;
                    if (b.getStatus() == BatchStatus.ACTIVE || b.getStatus() == BatchStatus.NEAR_EXPIRY) {
                        Long medId = b.getMedicine().getId();
                        int currentRank = medicineRankCounter.getOrDefault(medId, 0) + 1;
                        medicineRankCounter.put(medId, currentRank);
                        rank = currentRank;
                    }

                    return toResponseDto(b, days, urgency, rank > 0 ? rank : null);
                })
                .filter(dto -> urgencyFilter == null || urgencyFilter.trim().isEmpty() ||
                               urgencyFilter.equalsIgnoreCase("ALL") ||
                               dto.getUrgencyLevel().equalsIgnoreCase(urgencyFilter.trim()))
                .collect(Collectors.toList());
    }

    /**
     * Get batches for a specific medicine sorted by FEFO
     */
    public List<BatchResponse> getBatchesForMedicine(Long medicineId) {
        medicineRepository.findById(medicineId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + medicineId));

        List<InventoryBatch> batches = batchRepository.findByMedicineIdOrderByExpiryDateAsc(medicineId);
        LocalDate today = LocalDate.now();

        int rank = 1;
        List<BatchResponse> responses = new ArrayList<>();
        for (InventoryBatch batch : batches) {
            long days = ChronoUnit.DAYS.between(today, batch.getExpiryDate());
            String urgency = days < 0 ? "EXPIRED" : (days <= 30 ? "CRITICAL_FEFO" : (days <= 90 ? "MODERATE" : "SAFE"));
            Integer fefoRank = (batch.getStatus() == BatchStatus.ACTIVE || batch.getStatus() == BatchStatus.NEAR_EXPIRY) ? rank++ : null;
            responses.add(toResponseDto(batch, days, urgency, fefoRank));
        }
        return responses;
    }

    /**
     * Add a new batch for a medicine and refresh overall medicine inventory counts.
     */
    @Transactional
    public BatchResponse addBatch(BatchRequest request) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + request.getMedicineId()));

        if (batchRepository.existsByBatchNumber(request.getBatchNumber().trim())) {
            throw new IllegalArgumentException("A batch with batch number '" + request.getBatchNumber().trim() + "' already exists.");
        }

        LocalDate today = LocalDate.now();
        if (request.getManufacturingDate().isAfter(today)) {
            throw new IllegalArgumentException("Manufacturing date cannot be in the future.");
        }
        if (request.getManufacturingDate().isAfter(request.getExpiryDate())) {
            throw new IllegalArgumentException("Manufacturing date cannot be after the expiry date.");
        }
        BatchStatus initialStatus = request.getStatus() != null ? request.getStatus() : BatchStatus.ACTIVE;
        if (today.isAfter(request.getExpiryDate())) {
            initialStatus = BatchStatus.EXPIRED;
        } else if (ChronoUnit.DAYS.between(today, request.getExpiryDate()) <= 30 && initialStatus == BatchStatus.ACTIVE) {
            initialStatus = BatchStatus.NEAR_EXPIRY;
        }

        InventoryBatch batch = InventoryBatch.builder()
                .medicine(medicine)
                .batchNumber(request.getBatchNumber().trim().toUpperCase())
                .initialQuantity(request.getInitialQuantity())
                .quantityAvailable(request.getInitialQuantity())
                .stockQuantity(request.getInitialQuantity())
                .manufacturingDate(request.getManufacturingDate())
                .expiryDate(request.getExpiryDate())
                .shelfLocation(request.getShelfLocation() != null ? request.getShelfLocation().trim() : "Default Aisle")
                .quarantineReason(request.getQuarantineReason())
                .status(initialStatus)
                .build();

        InventoryBatch saved = batchRepository.save(batch);

        // Recalculate medicine total stock
        syncMedicineStock(medicine.getId());

        long days = ChronoUnit.DAYS.between(today, saved.getExpiryDate());
        String urgency = days < 0 ? "EXPIRED" : (days <= 30 ? "CRITICAL_FEFO" : (days <= 90 ? "MODERATE" : "SAFE"));
        return toResponseDto(saved, days, urgency, 1);
    }

    /**
     * Update full details of a batch (batch number, manufacturing date, expiry date, quantity, shelf location, status, quarantine reason)
     */
    @Transactional
    public BatchResponse updateBatch(Long batchId, BatchRequest request) {
        InventoryBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Batch not found with ID: " + batchId));

        if (request.getBatchNumber() != null && !request.getBatchNumber().trim().isEmpty()) {
            String newBatchNum = request.getBatchNumber().trim().toUpperCase();
            if (!newBatchNum.equalsIgnoreCase(batch.getBatchNumber()) && batchRepository.existsByBatchNumber(newBatchNum)) {
                throw new IllegalArgumentException("A batch with batch number '" + newBatchNum + "' already exists.");
            }
            batch.setBatchNumber(newBatchNum);
        }

        LocalDate today = LocalDate.now();
        if (request.getManufacturingDate() != null) {
            if (request.getManufacturingDate().isAfter(today)) {
                throw new IllegalArgumentException("Manufacturing date cannot be in the future.");
            }
            batch.setManufacturingDate(request.getManufacturingDate());
        }

        if (request.getExpiryDate() != null) {
            batch.setExpiryDate(request.getExpiryDate());
        }

        if (batch.getManufacturingDate() != null && batch.getExpiryDate() != null) {
            if (batch.getManufacturingDate().isAfter(batch.getExpiryDate())) {
                throw new IllegalArgumentException("Manufacturing date cannot be after the expiry date.");
            }
        }

        if (request.getInitialQuantity() != null && request.getInitialQuantity() > 0) {
            int oldInitial = batch.getInitialQuantity() != null ? batch.getInitialQuantity() : 0;
            int oldAvailable = batch.getQuantityAvailable() != null ? batch.getQuantityAvailable() : 0;
            int diff = request.getInitialQuantity() - oldInitial;
            batch.setInitialQuantity(request.getInitialQuantity());
            int newAvailable = Math.max(0, oldAvailable + diff);
            batch.setQuantityAvailable(newAvailable);
            batch.setStockQuantity(newAvailable);
        }

        if (request.getShelfLocation() != null) {
            batch.setShelfLocation(request.getShelfLocation().trim());
        }

        if (request.getStatus() != null) {
            batch.setStatus(request.getStatus());
        }

        if (request.getQuarantineReason() != null) {
            batch.setQuarantineReason(request.getQuarantineReason().trim());
        } else if (batch.getStatus() == BatchStatus.ACTIVE) {
            batch.setQuarantineReason(null);
        }

        // Recalculate status based on expiry if not quarantined
        LocalDate today = LocalDate.now();
        if (batch.getStatus() != BatchStatus.QUARANTINED) {
            if (today.isAfter(batch.getExpiryDate())) {
                batch.setStatus(BatchStatus.EXPIRED);
            } else if (ChronoUnit.DAYS.between(today, batch.getExpiryDate()) <= 30) {
                batch.setStatus(BatchStatus.NEAR_EXPIRY);
            } else {
                batch.setStatus(BatchStatus.ACTIVE);
            }
        }

        batch.setUpdatedAt(LocalDateTime.now());
        InventoryBatch saved = batchRepository.save(batch);

        // Recalculate parent medicine total stock
        syncMedicineStock(saved.getMedicine().getId());

        long days = ChronoUnit.DAYS.between(today, saved.getExpiryDate());
        String urgency = days < 0 ? "EXPIRED" : (days <= 30 ? "CRITICAL_FEFO" : (days <= 90 ? "MODERATE" : "SAFE"));
        return toResponseDto(saved, days, urgency, null);
    }

    /**
     * Update the status of a batch (ACTIVE, QUARANTINED, EXPIRED, NEAR_EXPIRY)
     */
    @Transactional
    public BatchResponse updateBatchStatus(Long batchId, BatchStatusUpdateRequest request) {
        InventoryBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Batch not found with ID: " + batchId));

        batch.setStatus(request.getStatus());
        if (request.getStatus() == BatchStatus.QUARANTINED) {
            batch.setQuarantineReason(request.getQuarantineReason() != null ? request.getQuarantineReason().trim() : "Quarantined by Pharmacist");
        } else if (request.getStatus() == BatchStatus.ACTIVE) {
            batch.setQuarantineReason(null);
        }

        InventoryBatch saved = batchRepository.save(batch);

        // Refresh parent medicine stock
        syncMedicineStock(saved.getMedicine().getId());

        long days = ChronoUnit.DAYS.between(LocalDate.now(), saved.getExpiryDate());
        String urgency = days < 0 ? "EXPIRED" : (days <= 30 ? "CRITICAL_FEFO" : (days <= 90 ? "MODERATE" : "SAFE"));
        return toResponseDto(saved, days, urgency, null);
    }

    /**
     * Delete a batch
     */
    @Transactional
    public void deleteBatch(Long batchId) {
        InventoryBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Batch not found with ID: " + batchId));
        Long medicineId = batch.getMedicine().getId();

        batchRepository.delete(batch);
        syncMedicineStock(medicineId);
    }

    /**
     * Simulate FEFO Dispatch Allocation without altering database values
     */
    public FefoSimulationResponse simulateFefoAllocation(Long medicineId, int requestedQuantity) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + medicineId));

        List<InventoryBatch> eligibleBatches = batchRepository.findByMedicineIdAndStatusInOrderByExpiryDateAsc(
                medicineId,
                List.of(BatchStatus.ACTIVE, BatchStatus.NEAR_EXPIRY)
        ).stream().filter(b -> b.getQuantityAvailable() != null && b.getQuantityAvailable() > 0).collect(Collectors.toList());

        List<FefoAllocationStep> steps = new ArrayList<>();
        int remainingNeeded = requestedQuantity;
        int stepNumber = 1;
        LocalDate today = LocalDate.now();

        for (InventoryBatch batch : eligibleBatches) {
            if (remainingNeeded <= 0) break;

            int available = batch.getQuantityAvailable();
            int allocate = Math.min(available, remainingNeeded);
            int after = available - allocate;
            remainingNeeded -= allocate;

            long days = ChronoUnit.DAYS.between(today, batch.getExpiryDate());
            String rationale = "Allocated " + allocate + " unit(s) from Batch " + batch.getBatchNumber() +
                               " (Earliest Expiry: " + batch.getExpiryDate() + ", " + days + " days remaining).";

            steps.add(FefoAllocationStep.builder()
                    .stepNumber(stepNumber++)
                    .batchId(batch.getId())
                    .batchNumber(batch.getBatchNumber())
                    .expiryDate(batch.getExpiryDate())
                    .daysUntilExpiry(days)
                    .shelfLocation(batch.getShelfLocation())
                    .batchAvailableBefore(available)
                    .allocatedFromBatch(allocate)
                    .batchRemainingAfter(after)
                    .rationale(rationale)
                    .build());
        }

        int fulfilled = requestedQuantity - remainingNeeded;
        boolean fullyFulfilled = remainingNeeded == 0;

        return FefoSimulationResponse.builder()
                .medicineId(medicine.getId())
                .medicineName(medicine.getName())
                .sku(medicine.getSku())
                .requestedQuantity(requestedQuantity)
                .totalFulfilledQuantity(fulfilled)
                .unfulfilledQuantity(remainingNeeded)
                .fullyFulfilled(fullyFulfilled)
                .dispatchStrategy("Strict FEFO (First Expiring, First Out)")
                .steps(steps)
                .message(fullyFulfilled
                        ? "Successfully simulated complete FEFO allocation across " + steps.size() + " batch(es)."
                        : "Partial fulfillment: Stock deficit of " + remainingNeeded + " units.")
                .build();
    }

    /**
     * Execute actual FEFO stock deduction
     */
    @Transactional
    public FefoSimulationResponse executeFefoDeduction(Long medicineId, int requestedQuantity) {
        FefoSimulationResponse plan = simulateFefoAllocation(medicineId, requestedQuantity);

        if (!plan.isFullyFulfilled()) {
            throw new IllegalStateException("Insufficient stock to fulfill request of " + requestedQuantity +
                    " units. Available active stock is " + plan.getTotalFulfilledQuantity() + " units.");
        }

        for (FefoAllocationStep step : plan.getSteps()) {
            InventoryBatch batch = batchRepository.findById(step.getBatchId())
                    .orElseThrow(() -> new IllegalStateException("Batch lost during deduction: " + step.getBatchNumber()));
            batch.setQuantityAvailable(step.getBatchRemainingAfter());
            batch.setStockQuantity(step.getBatchRemainingAfter());
            batchRepository.save(batch);
        }

        syncMedicineStock(medicineId);
        plan.setMessage("FEFO Stock Deduction successfully completed and persisted!");
        return plan;
    }

    /**
     * Calculate Real-Time Dashboard KPI Analytics
     */
    public SmartInventoryStatsResponse getStats() {
        long totalMedicines = medicineRepository.count();
        List<InventoryBatch> allBatches = batchRepository.findAll();

        long totalBatches = allBatches.size();
        long totalUnits = allBatches.stream()
                .mapToLong(b -> b.getQuantityAvailable() != null ? b.getQuantityAvailable() : 0)
                .sum();

        LocalDate today = LocalDate.now();
        LocalDate in30Days = today.plusDays(30);
        LocalDate in90Days = today.plusDays(90);

        long activeCount = 0;
        long nearExpiryCount = 0; // <= 30d
        long warningCount = 0;    // 31-90d
        long expiredCount = 0;
        long quarantinedCount = 0;

        for (InventoryBatch b : allBatches) {
            if (b.getStatus() == BatchStatus.QUARANTINED) {
                quarantinedCount++;
            } else if (b.getStatus() == BatchStatus.EXPIRED || (b.getExpiryDate() != null && today.isAfter(b.getExpiryDate()))) {
                expiredCount++;
            } else {
                activeCount++;
                if (b.getExpiryDate() != null) {
                    if (!today.isAfter(b.getExpiryDate()) && !b.getExpiryDate().isAfter(in30Days)) {
                        nearExpiryCount++;
                    } else if (b.getExpiryDate().isAfter(in30Days) && !b.getExpiryDate().isAfter(in90Days)) {
                        warningCount++;
                    }
                }
            }
        }

        double complianceRate = totalBatches > 0 ? ((double) (totalBatches - expiredCount) / totalBatches) * 100 : 100.0;

        return SmartInventoryStatsResponse.builder()
                .totalMedicines(totalMedicines)
                .totalBatches(totalBatches)
                .totalUnitsInStock(totalUnits)
                .activeBatches(activeCount)
                .nearExpiryBatches(nearExpiryCount)
                .warningBatches(warningCount)
                .expiredBatches(expiredCount)
                .quarantinedBatches(quarantinedCount)
                .fefoEfficiencyScore(String.format("%.1f%%", complianceRate))
                .build();
    }

    /**
     * Helper to synchronize medicine entity's stockQuantity with active batches
     */
    private void syncMedicineStock(Long medicineId) {
        Integer activeUnits = batchRepository.sumAvailableQuantityByMedicineAndStatuses(
                medicineId,
                List.of(BatchStatus.ACTIVE, BatchStatus.NEAR_EXPIRY)
        );
        medicineRepository.findById(medicineId).ifPresent(m -> {
            m.setStockQuantity(activeUnits != null ? activeUnits : 0);
            medicineRepository.save(m);
        });
    }

    private BatchResponse toResponseDto(InventoryBatch batch, long daysUntilExpiry, String urgency, Integer fefoRank) {
        Medicine m = batch.getMedicine();
        return BatchResponse.builder()
                .id(batch.getId())
                .medicineId(m != null ? m.getId() : null)
                .medicineName(m != null ? m.getName() : "Unknown Medicine")
                .genericName(m != null ? m.getGenericName() : "")
                .sku(m != null ? m.getSku() : "")
                .category(m != null ? m.getCategory() : "General")
                .unitPrice(m != null ? m.getUnitPrice() : null)
                .isTemperatureSensitive(m != null && Boolean.TRUE.equals(m.getIsTemperatureSensitive()))
                .batchNumber(batch.getBatchNumber())
                .initialQuantity(batch.getInitialQuantity())
                .quantityAvailable(batch.getQuantityAvailable())
                .stockQuantity(batch.getStockQuantity())
                .manufacturingDate(batch.getManufacturingDate())
                .expiryDate(batch.getExpiryDate())
                .shelfLocation(batch.getShelfLocation())
                .quarantineReason(batch.getQuarantineReason())
                .status(batch.getStatus())
                .createdAt(batch.getCreatedAt())
                .updatedAt(batch.getUpdatedAt())
                .daysUntilExpiry(daysUntilExpiry)
                .isExpired(daysUntilExpiry < 0 || batch.getStatus() == BatchStatus.EXPIRED)
                .urgencyLevel(urgency)
                .fefoRank(fefoRank)
                .build();
    }
}
