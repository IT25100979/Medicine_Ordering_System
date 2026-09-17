package com.mediorder.service;

import com.mediorder.dto.BatchRegistrationRequest;
import com.mediorder.dto.BatchResponse;
import com.mediorder.dto.UpdateBatchRequest;
import com.mediorder.dto.UpdateMedicineRequest;
import com.mediorder.exception.ResourceNotFoundException;
import com.mediorder.model.AuditLog;
import com.mediorder.model.BatchStatus;
import com.mediorder.model.InventoryBatch;
import com.mediorder.model.Medicine;
import com.mediorder.repository.AuditLogRepository;
import com.mediorder.repository.InventoryBatchRepository;
import com.mediorder.repository.MedicineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryBatchService {

    private static final Logger log = LoggerFactory.getLogger(InventoryBatchService.class);

    private final InventoryBatchRepository batchRepository;
    private final MedicineRepository medicineRepository;
    private final AuditLogRepository auditLogRepository;

    public InventoryBatchService(InventoryBatchRepository batchRepository,
                                 MedicineRepository medicineRepository,
                                 AuditLogRepository auditLogRepository) {
        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public BatchResponse registerBatch(BatchRegistrationRequest request, String registeredBy) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + request.getMedicineId()));

        if (batchRepository.findByBatchNumber(request.getBatchNumber()).isPresent()) {
            throw new IllegalArgumentException("Batch with number " + request.getBatchNumber() + " already exists");
        }

        InventoryBatch batch = new InventoryBatch();
        batch.setMedicine(medicine);
        batch.setBatchNumber(request.getBatchNumber());
        batch.setManufactureDate(request.getManufactureDate());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setInitialQuantity(request.getInitialQuantity());
        batch.setQuantityAvailable(request.getInitialQuantity());
        batch.setShelfLocation(request.getShelfLocation());

        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), request.getExpiryDate());
        if (daysUntilExpiry <= 30) {
            batch.setStatus(BatchStatus.NEAR_EXPIRY);
        } else {
            batch.setStatus(BatchStatus.ACTIVE);
        }

        InventoryBatch saved = batchRepository.save(batch);

        auditLogRepository.save(new AuditLog(
                "BATCH_REGISTERED",
                "InventoryBatch",
                saved.getId().toString(),
                registeredBy != null ? registeredBy : "assistant",
                String.format("Batch %s registered for %s with %d units (Expires: %s, Shelf: %s)",
                        saved.getBatchNumber(), medicine.getName(), saved.getInitialQuantity(), saved.getExpiryDate(), saved.getShelfLocation())
        ));

        log.info("Registered batch {} for medicine {}", saved.getBatchNumber(), medicine.getName());
        return mapToBatchResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> getAllBatches(Long medicineId, BatchStatus status) {
        List<InventoryBatch> batches;
        if (medicineId != null) {
            batches = batchRepository.findByMedicineIdOrderByExpiryDateAsc(medicineId);
        } else if (status != null) {
            batches = batchRepository.findByStatus(status);
        } else {
            batches = batchRepository.findAll();
        }
        return batches.stream().map(this::mapToBatchResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BatchResponse getBatchById(Long id) {
        InventoryBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + id));
        return mapToBatchResponse(batch);
    }

    /**
     * Manually quarantines a batch (e.g. damaged, failed inspection, clinical hold).
     */
    @Transactional
    public BatchResponse quarantineBatch(Long batchId, String reason, String performedBy) {
        InventoryBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        batch.setStatus(BatchStatus.QUARANTINED);
        batch.setQuarantineReason(reason != null ? reason : "Manual quarantine by pharmacy staff");
        InventoryBatch saved = batchRepository.save(batch);

        auditLogRepository.save(new AuditLog(
                "BATCH_QUARANTINED",
                "InventoryBatch",
                batch.getId().toString(),
                performedBy != null ? performedBy : "assistant",
                String.format("Batch %s locked in quarantine. Reason: %s", batch.getBatchNumber(), batch.getQuarantineReason())
        ));

        log.warn("Batch {} manually quarantined. Reason: {}", batch.getBatchNumber(), reason);
        return mapToBatchResponse(saved);
    }

    /**
     * Releases batch from quarantine back to active/near-expiry status.
     */
    @Transactional
    public BatchResponse releaseQuarantine(Long batchId, String performedBy) {
        InventoryBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        LocalDate today = LocalDate.now();
        if (batch.getExpiryDate().isBefore(today.plusDays(1))) {
            throw new IllegalArgumentException("Cannot release an expired batch back into active inventory");
        }

        long daysUntilExpiry = ChronoUnit.DAYS.between(today, batch.getExpiryDate());
        batch.setStatus(daysUntilExpiry <= 30 ? BatchStatus.NEAR_EXPIRY : BatchStatus.ACTIVE);
        batch.setQuarantineReason(null);
        InventoryBatch saved = batchRepository.save(batch);

        auditLogRepository.save(new AuditLog(
                "BATCH_QUARANTINE_RELEASED",
                "InventoryBatch",
                batch.getId().toString(),
                performedBy != null ? performedBy : "assistant",
                String.format("Batch %s released from quarantine back to status %s", batch.getBatchNumber(), batch.getStatus())
        ));

        return mapToBatchResponse(saved);
    }

    /**
     * Automated cron job to detect and lock expired/near-expiry batches (SP2-01 / PBI-07 / T-01.2).
     * Runs nightly at 01:00 AM, and can also be triggered manually via API.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public int autoQuarantineExpiredBatches() {
        LocalDate today = LocalDate.now();
        List<InventoryBatch> expiredBatches = batchRepository.findByExpiryDateLessThanEqualAndStatusNot(today, BatchStatus.EXPIRED);

        int updatedCount = 0;
        for (InventoryBatch batch : expiredBatches) {
            batch.setStatus(BatchStatus.EXPIRED);
            batch.setQuarantineReason("Automatically locked due to passing expiry date (" + batch.getExpiryDate() + ")");
            batchRepository.save(batch);
            updatedCount++;

            auditLogRepository.save(new AuditLog(
                    "BATCH_AUTO_EXPIRED_LOCKED",
                    "InventoryBatch",
                    batch.getId().toString(),
                    "cron_scheduler",
                    String.format("Batch %s automatically locked as EXPIRED", batch.getBatchNumber())
            ));
        }

        // Also update batches that entered the 30-day near-expiry window
        List<InventoryBatch> activeBatches = batchRepository.findByStatus(BatchStatus.ACTIVE);
        for (InventoryBatch batch : activeBatches) {
            long days = ChronoUnit.DAYS.between(today, batch.getExpiryDate());
            if (days <= 30 && days >= 0) {
                batch.setStatus(BatchStatus.NEAR_EXPIRY);
                batchRepository.save(batch);
            }
        }

        log.info("Batch expiry check completed. {} batches marked as EXPIRED and locked from dispensing.", updatedCount);
        return updatedCount;
    }

    @Transactional
    public BatchResponse updateBatch(Long batchId, UpdateBatchRequest request, String updatedBy) {
        InventoryBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        int oldQty = batch.getQuantityAvailable();
        String oldShelf = batch.getShelfLocation();
        LocalDate oldExpiry = batch.getExpiryDate();
        BatchStatus oldStatus = batch.getStatus();

        if (request.getQuantityAvailable() != null) {
            batch.setQuantityAvailable(request.getQuantityAvailable());
        }
        if (request.getShelfLocation() != null) {
            batch.setShelfLocation(request.getShelfLocation());
        }
        if (request.getExpiryDate() != null) {
            batch.setExpiryDate(request.getExpiryDate());
        }
        if (request.getStatus() != null) {
            batch.setStatus(request.getStatus());
        }
        if (request.getQuarantineReason() != null) {
            batch.setQuarantineReason(request.getQuarantineReason());
        }

        // Auto calculate status based on updated expiry date if not quarantined/expired
        if (batch.getStatus() == BatchStatus.ACTIVE || batch.getStatus() == BatchStatus.NEAR_EXPIRY) {
            LocalDate today = LocalDate.now();
            if (batch.getExpiryDate().isBefore(today.plusDays(1))) {
                batch.setStatus(BatchStatus.EXPIRED);
                batch.setQuarantineReason("Auto-expired based on updated expiry date");
            } else {
                long daysUntilExpiry = ChronoUnit.DAYS.between(today, batch.getExpiryDate());
                batch.setStatus(daysUntilExpiry <= 30 ? BatchStatus.NEAR_EXPIRY : BatchStatus.ACTIVE);
            }
        }

        InventoryBatch saved = batchRepository.save(batch);

        auditLogRepository.save(new AuditLog(
                "BATCH_UPDATED",
                "InventoryBatch",
                saved.getId().toString(),
                updatedBy != null ? updatedBy : "pharmacist",
                String.format("Batch %s updated: Qty %d->%d, Shelf '%s'->'%s', Expiry %s->%s, Status %s->%s",
                        saved.getBatchNumber(), oldQty, saved.getQuantityAvailable(),
                        oldShelf, saved.getShelfLocation(),
                        oldExpiry, saved.getExpiryDate(),
                        oldStatus, saved.getStatus())
        ));

        log.info("Batch {} updated successfully by {}", saved.getBatchNumber(), updatedBy);
        return mapToBatchResponse(saved);
    }

    @Transactional
    public Medicine updateMedicine(Long medicineId, UpdateMedicineRequest request, String updatedBy) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + medicineId));

        String oldName = medicine.getName();
        medicine.setName(request.getName());
        if (request.getGenericName() != null) medicine.setGenericName(request.getGenericName());
        if (request.getCategory() != null) medicine.setCategory(request.getCategory());
        if (request.getDosage() != null) medicine.setDosage(request.getDosage());
        if (request.getUnitPrice() != null) medicine.setUnitPrice(request.getUnitPrice());
        medicine.setRequiresPrescription(request.isRequiresPrescription());
        medicine.setReorderThreshold(request.getReorderThreshold());
        if (request.getDescription() != null) medicine.setDescription(request.getDescription());

        Medicine saved = medicineRepository.save(medicine);

        auditLogRepository.save(new AuditLog(
                "MEDICINE_UPDATED",
                "Medicine",
                saved.getId().toString(),
                updatedBy != null ? updatedBy : "pharmacist",
                String.format("Medicine '%s' (ID: %d) details updated. Unit price: $%s, Reorder threshold: %d",
                        oldName, saved.getId(), saved.getUnitPrice(), saved.getReorderThreshold())
        ));

        log.info("Medicine {} updated successfully by {}", saved.getName(), updatedBy);
        return saved;
    }

    private BatchResponse mapToBatchResponse(InventoryBatch batch) {
        BatchResponse res = new BatchResponse();
        res.setId(batch.getId());
        res.setMedicineId(batch.getMedicine().getId());
        res.setMedicineName(batch.getMedicine().getName());
        res.setBatchNumber(batch.getBatchNumber());
        res.setManufactureDate(batch.getManufactureDate());
        res.setExpiryDate(batch.getExpiryDate());
        res.setQuantityAvailable(batch.getQuantityAvailable());
        res.setInitialQuantity(batch.getInitialQuantity());
        res.setShelfLocation(batch.getShelfLocation());
        res.setStatus(batch.getStatus());
        res.setQuarantineReason(batch.getQuarantineReason());
        res.setCreatedAt(batch.getCreatedAt());
        return res;
    }
}
