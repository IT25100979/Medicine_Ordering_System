package com.mediorder.service;

import com.mediorder.dto.BatchAllocationPlanDto;
import com.mediorder.dto.FefoAllocationPreviewResponse;
import com.mediorder.exception.InsufficientStockException;
import com.mediorder.exception.ResourceNotFoundException;
import com.mediorder.model.BatchStatus;
import com.mediorder.model.InventoryBatch;
import com.mediorder.model.Medicine;
import com.mediorder.repository.InventoryBatchRepository;
import com.mediorder.repository.MedicineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class FefoAllocationService {

    private static final Logger log = LoggerFactory.getLogger(FefoAllocationService.class);

    private final InventoryBatchRepository batchRepository;
    private final MedicineRepository medicineRepository;

    public FefoAllocationService(InventoryBatchRepository batchRepository, MedicineRepository medicineRepository) {
        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
    }

    public static class AllocationResult {
        private final InventoryBatch batch;
        private final int allocatedQuantity;

        public AllocationResult(InventoryBatch batch, int allocatedQuantity) {
            this.batch = batch;
            this.allocatedQuantity = allocatedQuantity;
        }

        public InventoryBatch getBatch() {
            return batch;
        }

        public int getAllocatedQuantity() {
            return allocatedQuantity;
        }
    }

    /**
     * Executes FEFO allocation with transactional locking and stock deduction.
     * Batches are sorted strictly by earliest expiry date ASC.
     * Quarantined, Expired, and past-expiry batches are strictly excluded.
     */
    @Transactional
    public List<AllocationResult> allocateStockFefo(Long medicineId, int requestedQuantity) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + medicineId));

        LocalDate today = LocalDate.now();

        // Lock eligible active and near-expiry batches to prevent concurrent race condition over-allocations (T-06.3)
        List<InventoryBatch> eligibleBatches = batchRepository.findActiveBatchesForFefoWithLock(
                medicineId,
                Arrays.asList(BatchStatus.ACTIVE, BatchStatus.NEAR_EXPIRY),
                today
        );

        int totalAvailable = eligibleBatches.stream().mapToInt(InventoryBatch::getQuantityAvailable).sum();
        if (totalAvailable < requestedQuantity) {
            throw new InsufficientStockException(String.format(
                    "Insufficient non-expired stock for medicine '%s'. Requested: %d, Available non-quarantined stock: %d",
                    medicine.getName(), requestedQuantity, totalAvailable
            ));
        }

        List<AllocationResult> results = new ArrayList<>();
        int remainingToAllocate = requestedQuantity;

        for (InventoryBatch batch : eligibleBatches) {
            if (remainingToAllocate <= 0) {
                break;
            }

            int batchAvailable = batch.getQuantityAvailable();
            int deductAmount = Math.min(batchAvailable, remainingToAllocate);

            batch.setQuantityAvailable(batchAvailable - deductAmount);
            batchRepository.save(batch);

            results.add(new AllocationResult(batch, deductAmount));
            remainingToAllocate -= deductAmount;

            log.info("FEFO Allocated {} units of '{}' from Batch {} (Expiry: {})",
                    deductAmount, medicine.getName(), batch.getBatchNumber(), batch.getExpiryDate());
        }

        // Low stock reorder threshold check (SP3-05 / PBI-17 / T-04.2)
        int updatedTotalStock = batchRepository.sumAvailableStock(
                medicineId,
                Arrays.asList(BatchStatus.ACTIVE, BatchStatus.NEAR_EXPIRY),
                today
        );
        if (updatedTotalStock <= medicine.getReorderThreshold()) {
            log.warn("ALERT: Stock level for '{}' has fallen to {} units, which is at or below reorder threshold ({})!",
                    medicine.getName(), updatedTotalStock, medicine.getReorderThreshold());
        }

        return results;
    }

    /**
     * Non-destructive preview of how FEFO would allocate stock for a given medicine and quantity.
     */
    @Transactional(readOnly = true)
    public FefoAllocationPreviewResponse previewFefoAllocation(Long medicineId, int requestedQuantity) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + medicineId));

        LocalDate today = LocalDate.now();

        List<InventoryBatch> activeBatches = batchRepository.findActiveBatchesForFefo(
                medicineId,
                Arrays.asList(BatchStatus.ACTIVE, BatchStatus.NEAR_EXPIRY),
                today
        );

        List<InventoryBatch> allBatches = batchRepository.findByMedicineIdOrderByExpiryDateAsc(medicineId);

        FefoAllocationPreviewResponse response = new FefoAllocationPreviewResponse();
        response.setMedicineId(medicineId);
        response.setMedicineName(medicine.getName());
        response.setRequestedQuantity(requestedQuantity);

        List<BatchAllocationPlanDto> plan = new ArrayList<>();
        int remaining = requestedQuantity;
        int totalAllocated = 0;

        for (InventoryBatch batch : activeBatches) {
            if (remaining <= 0) break;

            int available = batch.getQuantityAvailable();
            int alloc = Math.min(available, remaining);
            int remainingAfter = available - alloc;

            plan.add(new BatchAllocationPlanDto(
                    batch.getId(),
                    batch.getBatchNumber(),
                    batch.getExpiryDate(),
                    alloc,
                    remainingAfter,
                    batch.getShelfLocation()
            ));

            totalAllocated += alloc;
            remaining -= alloc;
        }

        response.setAllocatedQuantity(totalAllocated);
        response.setAllocationPlan(plan);
        response.setFullyFulfilled(totalAllocated == requestedQuantity);
        response.setShortage(Math.max(0, requestedQuantity - totalAllocated));

        // Note excluded batches (quarantined or expired)
        for (InventoryBatch batch : allBatches) {
            if (batch.getStatus() == BatchStatus.QUARANTINED) {
                response.getExclusionNotes().add(String.format("Batch %s excluded: QUARANTINED (Reason: %s)",
                        batch.getBatchNumber(), batch.getQuarantineReason()));
            } else if (batch.getStatus() == BatchStatus.EXPIRED || batch.getExpiryDate().isBefore(today.plusDays(1))) {
                response.getExclusionNotes().add(String.format("Batch %s excluded: EXPIRED (Date: %s)",
                        batch.getBatchNumber(), batch.getExpiryDate()));
            }
        }

        return response;
    }
}
