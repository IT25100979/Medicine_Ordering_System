package com.medilink.service;

import com.medilink.entity.Batch;
import com.medilink.exception.BatchNotFoundException;
import com.medilink.exception.InsufficientStockException;
import com.medilink.repository.BatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private BatchRepository batchRepository;

    // PBI-05: real-time stock levels for a medicine
    public List<Batch> getStockLevels(Long medicineId) {
        return batchRepository.findByMedicineId(medicineId);
    }

    // PBI-06: FEFO - suggest batch to pick first (soonest expiry, not locked)
    public Batch getFefoSuggestion(Long medicineId, int requiredQty) {
        List<Batch> batches = batchRepository
                .findByMedicineIdAndLockedFalseOrderByExpiryDateAsc(medicineId);

        if (batches.isEmpty()) {
            throw new BatchNotFoundException("No available batch for medicine id: " + medicineId);
        }

        Batch suggested = batches.get(0);
        if (suggested.getQuantity() < requiredQty) {
            throw new InsufficientStockException(
                    "Batch " + suggested.getId() + " has only " + suggested.getQuantity() + " units");
        }
        return suggested;
    }

    // deduct stock after picking
    public void deductStock(Long batchId, int qty) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new BatchNotFoundException("Batch not found: " + batchId));
        if (batch.getQuantity() < qty) {
            throw new InsufficientStockException("Not enough stock in batch " + batchId);
        }
        batch.setQuantity(batch.getQuantity() - qty);
        batchRepository.save(batch);
    }
}