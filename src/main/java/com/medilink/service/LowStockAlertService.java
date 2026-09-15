package com.medilink.service;

import com.medilink.entity.Batch;
import com.medilink.entity.Medicine;
import com.medilink.repository.BatchRepository;
import com.medilink.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LowStockAlertService {

    @Autowired
    private MedicineRepository medicineRepository;
    @Autowired
    private BatchRepository batchRepository;

    public List<Medicine> getLowStockMedicines() {
        List<Medicine> lowStockList = new ArrayList<>();
        List<Medicine> allMedicines = medicineRepository.findAll();

        for (Medicine medicine : allMedicines) {
            int totalStock = batchRepository.findByMedicineId(medicine.getId())
                    .stream()
                    .filter(b -> !b.isLocked())
                    .mapToInt(Batch::getQuantity)
                    .sum();

            if (totalStock < medicine.getLowStockThreshold()) {
                lowStockList.add(medicine);
            }
        }
        return lowStockList;
    }
}