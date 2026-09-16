package com.medilink.service;

import com.medilink.entity.Batch;
import com.medilink.entity.Medicine;
import com.medilink.exception.BatchNotFoundException;
import com.medilink.exception.InsufficientStockException;
import com.medilink.repository.BatchRepository;
import com.medilink.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    // ---------- READ ----------

    public List<Batch> getStockLevels(Long medicineId) {
        return batchRepository.findByMedicineId(medicineId);
    }

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

    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    // ---------- CREATE ----------

    public Medicine createMedicine(Medicine medicine) {
        return medicineRepository.save(medicine);
    }

    public Batch createBatch(Long medicineId, Batch batch) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new BatchNotFoundException("Medicine not found: " + medicineId));
        batch.setMedicine(medicine);
        return batchRepository.save(batch);
    }

    // ---------- UPDATE ----------

    public Medicine updateMedicine(Long id, Medicine updated) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new BatchNotFoundException("Medicine not found: " + id));
        medicine.setName(updated.getName());
        medicine.setCategory(updated.getCategory());
        medicine.setColdChain(updated.isColdChain());
        medicine.setLowStockThreshold(updated.getLowStockThreshold());
        return medicineRepository.save(medicine);
    }

    public Batch updateBatch(Long id, Batch updated) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new BatchNotFoundException("Batch not found: " + id));
        batch.setBatchNumber(updated.getBatchNumber());
        batch.setQuantity(updated.getQuantity());
        batch.setExpiryDate(updated.getExpiryDate());
        batch.setLocked(updated.isLocked());
        return batchRepository.save(batch);
    }

    public void deductStock(Long batchId, int qty) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new BatchNotFoundException("Batch not found: " + batchId));
        if (batch.getQuantity() < qty) {
            throw new InsufficientStockException("Not enough stock in batch " + batchId);
        }
        batch.setQuantity(batch.getQuantity() - qty);
        batchRepository.save(batch);
    }

    // ---------- DELETE ----------

    public void deleteMedicine(Long id) {
        if (!medicineRepository.existsById(id)) {
            throw new BatchNotFoundException("Medicine not found: " + id);
        }
        medicineRepository.deleteById(id);
    }

    public void deleteBatch(Long id) {
        if (!batchRepository.existsById(id)) {
            throw new BatchNotFoundException("Batch not found: " + id);
        }
        batchRepository.deleteById(id);
    }
}