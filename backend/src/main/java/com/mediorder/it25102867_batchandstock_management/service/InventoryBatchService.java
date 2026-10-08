package com.mediorder.it25102867_batchandstock_management.service;

import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainTag;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTagRepository;
import com.mediorder.it25102867_batchandstock_management.model.BatchStatus;
import com.mediorder.it25102867_batchandstock_management.model.InventoryBatch;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.InventoryBatchRepository;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.system_build_functions.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class InventoryBatchService {

    @Autowired
    private InventoryBatchRepository inventoryBatchRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private ColdChainTagRepository coldChainTagRepository;

    @Autowired(required = false)
    private AuditService auditService;

    @Transactional(readOnly = true)
    public List<InventoryBatch> getAllBatches(String statusFilter, Long medicineId) {
        if (medicineId != null) {
            return inventoryBatchRepository.findByMedicineId(medicineId);
        }
        if (statusFilter != null && !statusFilter.trim().isEmpty() && !statusFilter.equalsIgnoreCase("ALL")) {
            try {
                BatchStatus st = BatchStatus.valueOf(statusFilter.trim().toUpperCase());
                return inventoryBatchRepository.findByStatusOrderByExpiryDateAsc(st);
            } catch (IllegalArgumentException ignored) {}
        }
        return inventoryBatchRepository.findAllByOrderByBatchNumberAscIdAsc();
    }

    @Transactional(readOnly = true)
    public InventoryBatch getBatchById(Long id) {
        return inventoryBatchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory Batch not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getGroupedBatches() {
        List<InventoryBatch> all = inventoryBatchRepository.findAllByOrderByBatchNumberAscIdAsc();
        Map<String, List<InventoryBatch>> groups = new LinkedHashMap<>();

        for (InventoryBatch b : all) {
            String bNum = b.getBatchNumber() != null ? b.getBatchNumber() : "UNASSIGNED_BATCH";
            groups.computeIfAbsent(bNum, k -> new ArrayList<>()).add(b);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        int index = 1;
        for (Map.Entry<String, List<InventoryBatch>> entry : groups.entrySet()) {
            String batchNumber = entry.getKey();
            List<InventoryBatch> items = entry.getValue();

            int totalStock = 0;
            int totalReceived = 0;
            int totalReserved = 0;
            LocalDate earliestExpiry = null;
            LocalDate latestMfg = null;
            LocalDate arrivedDate = null;
            BatchStatus dominantStatus = BatchStatus.LIVE;
            boolean hasReview = false;
            boolean hasQuarantine = false;

            List<Map<String, Object>> medicineList = new ArrayList<>();

            for (InventoryBatch b : items) {
                totalStock += (b.getStockQuantity() != null ? b.getStockQuantity() : 0);
                totalReceived += (b.getQtyReceived() != null ? b.getQtyReceived() : 0);
                totalReserved += (b.getQtyReserved() != null ? b.getQtyReserved() : 0);

                if (b.getExpiryDate() != null) {
                    if (earliestExpiry == null || b.getExpiryDate().isBefore(earliestExpiry)) {
                        earliestExpiry = b.getExpiryDate();
                    }
                }
                if (b.getManufacturingDate() != null) {
                    if (latestMfg == null || b.getManufacturingDate().isAfter(latestMfg)) {
                        latestMfg = b.getManufacturingDate();
                    }
                }
                if (b.getArrivedDate() != null && arrivedDate == null) {
                    arrivedDate = b.getArrivedDate();
                }

                if (b.getStatus() == BatchStatus.COLD_CHAIN_REVIEW) hasReview = true;
                if (b.getStatus() == BatchStatus.QUARANTINED) hasQuarantine = true;

                // Build medicine details inside batch
                Map<String, Object> mData = new HashMap<>();
                mData.put("batchItemId", b.getId());
                mData.put("stockQuantity", b.getStockQuantity());
                mData.put("qtyReceived", b.getQtyReceived());
                mData.put("qtyReserved", b.getQtyReserved());
                mData.put("status", b.getStatus().name());
                mData.put("manufacturingDate", b.getManufacturingDate());
                mData.put("expiryDate", b.getExpiryDate());
                mData.put("arrivedDate", b.getArrivedDate());
                mData.put("qcNotes", b.getQcNotes());

                Medicine med = b.getMedicine();
                if (med != null) {
                    mData.put("medicineId", med.getId());
                    mData.put("medicineName", med.getName());
                    mData.put("genericName", med.getGenericName());
                    mData.put("sku", med.getSku());
                    mData.put("category", med.getCategory());
                    mData.put("unitPrice", med.getUnitPrice());
                    mData.put("cogs", med.getCogs());
                    mData.put("shelfLocation", med.getShelfLocation());
                    mData.put("storageRequirement", med.getStorageRequirement());
                    mData.put("isTemperatureSensitive", med.getIsTemperatureSensitive());
                    mData.put("requiresPrescription", med.getRequiresPrescription());
                    mData.put("imageUrl", med.getImageUrl());
                    mData.put("isQuarantined", med.getIsQuarantined());

                    // Cold chain tag details if any
                    Optional<ColdChainTag> tagOpt = coldChainTagRepository.findByMedicineId(med.getId());
                    if (tagOpt.isPresent()) {
                        ColdChainTag tag = tagOpt.get();
                        mData.put("tagId", tag.getId());
                        mData.put("section", tag.getSection().name());
                        mData.put("intensity", tag.getIntensity().name());
                        mData.put("securityLevel", tag.getSecurityLevel().name());
                        mData.put("storageTempMin", tag.getStorageTempMin());
                        mData.put("storageTempMax", tag.getStorageTempMax());
                        mData.put("shelfLifeDays", tag.getShelfLifeDays());
                        mData.put("deliveryActions", tag.getDeliveryActions());
                        mData.put("tagStatus", tag.getStatus());
                    } else {
                        mData.put("tagId", null);
                        mData.put("section", med.getIsTemperatureSensitive() ? "REFRIGERATED" : "AMBIENT");
                        mData.put("intensity", med.getRequiresPrescription() ? "HIGH" : "LOW");
                        mData.put("securityLevel", "STANDARD");
                        mData.put("tagStatus", "UNTAGGED");
                    }
                }
                medicineList.add(mData);
            }

            if (hasQuarantine) dominantStatus = BatchStatus.QUARANTINED;
            else if (hasReview) dominantStatus = BatchStatus.COLD_CHAIN_REVIEW;
            else if (!items.isEmpty()) dominantStatus = items.get(0).getStatus();

            Map<String, Object> groupMap = new HashMap<>();
            groupMap.put("batchNumber", batchNumber);
            groupMap.put("batchDisplayName", "Batch " + index + " (" + batchNumber + ")");
            groupMap.put("batchIndex", index);
            groupMap.put("status", dominantStatus.name());
            groupMap.put("medicineCount", items.size());
            groupMap.put("totalStock", totalStock);
            groupMap.put("totalReceived", totalReceived);
            groupMap.put("totalReserved", totalReserved);
            groupMap.put("arrivedDate", arrivedDate != null ? arrivedDate : LocalDate.now());
            groupMap.put("manufacturingDate", latestMfg != null ? latestMfg : LocalDate.now().minusMonths(2));
            groupMap.put("expiryDate", earliestExpiry != null ? earliestExpiry : LocalDate.now().plusMonths(18));
            groupMap.put("medicines", medicineList);

            result.add(groupMap);
            index++;
        }

        return result;
    }

    public InventoryBatch createBatch(InventoryBatch batch) {
        if (batch.getMedicine() != null && batch.getMedicine().getId() != null) {
            Medicine med = medicineRepository.findById(batch.getMedicine().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found with id: " + batch.getMedicine().getId()));
            batch.setMedicine(med);
        }
        if (batch.getCreatedAt() == null) {
            batch.setCreatedAt(LocalDateTime.now());
        }
        InventoryBatch saved = inventoryBatchRepository.save(batch);

        if (auditService != null) {
            auditService.logAction("CREATE_INVENTORY_BATCH", "InventoryBatch", String.valueOf(saved.getId()),
                    "NONE", "Batch: " + saved.getBatchNumber() + " (" + saved.getStatus() + ")");
        }
        return saved;
    }

    public InventoryBatch updateBatch(Long id, InventoryBatch updates) {
        InventoryBatch existing = getBatchById(id);
        if (updates.getBatchNumber() != null) existing.setBatchNumber(updates.getBatchNumber().trim());
        if (updates.getStockQuantity() != null) existing.setStockQuantity(updates.getStockQuantity());
        if (updates.getQtyReceived() != null) existing.setQtyReceived(updates.getQtyReceived());
        if (updates.getQtyReserved() != null) existing.setQtyReserved(updates.getQtyReserved());
        if (updates.getManufacturingDate() != null) existing.setManufacturingDate(updates.getManufacturingDate());
        if (updates.getExpiryDate() != null) existing.setExpiryDate(updates.getExpiryDate());
        if (updates.getArrivedDate() != null) existing.setArrivedDate(updates.getArrivedDate());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        if (updates.getQcNotes() != null) existing.setQcNotes(updates.getQcNotes());
        if (updates.getQcPassedBy() != null) existing.setQcPassedBy(updates.getQcPassedBy());

        return inventoryBatchRepository.save(existing);
    }

    public void deleteBatch(Long id) {
        InventoryBatch existing = getBatchById(id);
        inventoryBatchRepository.delete(existing);
    }

    public InventoryBatch updateBatchStatus(Long id, BatchStatus status, String actorEmail) {
        InventoryBatch batch = getBatchById(id);
        BatchStatus prev = batch.getStatus();
        batch.setStatus(status);
        if (status == BatchStatus.LIVE) {
            batch.setQcPassedBy(actorEmail);
        }
        InventoryBatch saved = inventoryBatchRepository.save(batch);

        if (auditService != null) {
            auditService.logAction("UPDATE_BATCH_STATUS", "InventoryBatch", String.valueOf(id),
                    prev.name(), status.name() + " by " + actorEmail);
        }
        return saved;
    }

    public List<InventoryBatch> updateBatchGroupByNumberStatus(String batchNumber, BatchStatus status, String actorEmail) {
        List<InventoryBatch> batches = inventoryBatchRepository.findAllByBatchNumber(batchNumber);
        if (batches.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No batches found with batchNumber: " + batchNumber);
        }
        for (InventoryBatch b : batches) {
            b.setStatus(status);
            if (status == BatchStatus.LIVE) {
                b.setQcPassedBy(actorEmail);
            }
        }
        List<InventoryBatch> saved = inventoryBatchRepository.saveAll(batches);

        if (auditService != null) {
            auditService.logAction("UPDATE_BATCH_GROUP_STATUS", "InventoryBatchGroup", batchNumber,
                    "MULTIPLE", status.name() + " (" + saved.size() + " medicines) by " + actorEmail);
        }
        return saved;
    }

    public InventoryBatch sendBatchForTagging(Long id, String actorEmail) {
        return updateBatchStatus(id, BatchStatus.COLD_CHAIN_REVIEW, actorEmail);
    }

    public List<InventoryBatch> sendBatchGroupByNumberForTagging(String batchNumber, String actorEmail) {
        return updateBatchGroupByNumberStatus(batchNumber, BatchStatus.COLD_CHAIN_REVIEW, actorEmail);
    }

    public InventoryBatch approveBatchLive(Long id, String reviewerEmail) {
        InventoryBatch batch = getBatchById(id);
        batch.setStatus(BatchStatus.LIVE);
        batch.setQcPassedBy(reviewerEmail);
        InventoryBatch saved = inventoryBatchRepository.save(batch);

        // Sync cold chain tag status to APPROVED if present
        if (batch.getMedicine() != null) {
            coldChainTagRepository.findByMedicineId(batch.getMedicine().getId()).ifPresent(tag -> {
                tag.setStatus("APPROVED");
                tag.setReviewedBy(reviewerEmail);
                tag.setReviewedAt(LocalDateTime.now());
                coldChainTagRepository.save(tag);
            });
        }

        if (auditService != null) {
            auditService.logAction("APPROVE_BATCH_LIVE", "InventoryBatch", String.valueOf(id),
                    "COLD_CHAIN_REVIEW", "LIVE by " + reviewerEmail);
        }
        return saved;
    }

    public List<InventoryBatch> approveBatchGroupByNumberLive(String batchNumber, String reviewerEmail) {
        List<InventoryBatch> batches = inventoryBatchRepository.findAllByBatchNumber(batchNumber);
        for (InventoryBatch b : batches) {
            b.setStatus(BatchStatus.LIVE);
            b.setQcPassedBy(reviewerEmail);

            if (b.getMedicine() != null) {
                coldChainTagRepository.findByMedicineId(b.getMedicine().getId()).ifPresent(tag -> {
                    tag.setStatus("APPROVED");
                    tag.setReviewedBy(reviewerEmail);
                    tag.setReviewedAt(LocalDateTime.now());
                    coldChainTagRepository.save(tag);
                });
            }
        }
        List<InventoryBatch> saved = inventoryBatchRepository.saveAll(batches);

        if (auditService != null) {
            auditService.logAction("APPROVE_BATCH_GROUP_LIVE", "InventoryBatchGroup", batchNumber,
                    "COLD_CHAIN_REVIEW", "LIVE (" + saved.size() + " items) by " + reviewerEmail);
        }
        return saved;
    }
}
