package com.mediorder.service;

import com.mediorder.model.Medicine;
import com.mediorder.repository.MedicineRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@Transactional
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    @PostConstruct
    public void seedInitialCatalogIfEmpty() {
        if (medicineRepository.count() == 0) {
            List<Medicine> initialCatalog = Arrays.asList(
                    Medicine.builder()
                            .name("Atorvastatin 20mg (Lipitor)")
                            .genericName("Atorvastatin Calcium")
                            .sku("MED-LIP-020")
                            .requiresPrescription(true)
                            .isTemperatureSensitive(false)
                            .unitPrice(new BigDecimal("24.50"))
                            .createdAt(LocalDateTime.now())
                            .build(),
                    Medicine.builder()
                            .name("Amoxicillin 500mg (Amoxil)")
                            .genericName("Amoxicillin Trihydrate")
                            .sku("MED-AMX-500")
                            .requiresPrescription(true)
                            .isTemperatureSensitive(false)
                            .unitPrice(new BigDecimal("14.20"))
                            .createdAt(LocalDateTime.now())
                            .build(),
                    Medicine.builder()
                            .name("Metformin HCl 500mg (Glucophage)")
                            .genericName("Metformin Hydrochloride")
                            .sku("MED-MET-500")
                            .requiresPrescription(true)
                            .isTemperatureSensitive(false)
                            .unitPrice(new BigDecimal("18.00"))
                            .createdAt(LocalDateTime.now())
                            .build(),
                    Medicine.builder()
                            .name("Omeprazole 20mg (Prilosec OTC)")
                            .genericName("Omeprazole Delayed-Release")
                            .sku("MED-OME-020")
                            .requiresPrescription(false)
                            .isTemperatureSensitive(false)
                            .unitPrice(new BigDecimal("12.90"))
                            .createdAt(LocalDateTime.now())
                            .build(),
                    Medicine.builder()
                            .name("Lisinopril 10mg (Prinivil)")
                            .genericName("Lisinopril Dihydrate")
                            .sku("MED-LIS-010")
                            .requiresPrescription(true)
                            .isTemperatureSensitive(false)
                            .unitPrice(new BigDecimal("16.50"))
                            .createdAt(LocalDateTime.now())
                            .build(),
                    Medicine.builder()
                            .name("Insulin Glargine (Lantus SoloStar)")
                            .genericName("Insulin Glargine Recombinant")
                            .sku("MED-INS-100")
                            .requiresPrescription(true)
                            .isTemperatureSensitive(true)
                            .minTemp(new BigDecimal("2.00"))
                            .maxTemp(new BigDecimal("8.00"))
                            .unitPrice(new BigDecimal("68.00"))
                            .createdAt(LocalDateTime.now())
                            .build(),
                    Medicine.builder()
                            .name("Azithromycin 250mg (Zithromax Z-Pak)")
                            .genericName("Azithromycin Monohydrate")
                            .sku("MED-AZI-250")
                            .requiresPrescription(true)
                            .isTemperatureSensitive(false)
                            .unitPrice(new BigDecimal("22.00"))
                            .createdAt(LocalDateTime.now())
                            .build(),
                    Medicine.builder()
                            .name("Ibuprofen 400mg (Advil Ultra)")
                            .genericName("Ibuprofen Solubilized")
                            .sku("MED-IBU-400")
                            .requiresPrescription(false)
                            .isTemperatureSensitive(false)
                            .unitPrice(new BigDecimal("9.75"))
                            .createdAt(LocalDateTime.now())
                            .build()
            );

            medicineRepository.saveAll(initialCatalog);
            System.out.println("[MedicineService] Initialized pharmaceutical catalog with " + initialCatalog.size() + " medications.");
        }
    }

    @Transactional(readOnly = true)
    public List<Medicine> getAllMedicines(String query, Boolean requiresPrescription) {
        if (query != null && !query.trim().isEmpty()) {
            return medicineRepository.findByNameContainingIgnoreCaseOrGenericNameContainingIgnoreCase(query.trim(), query.trim());
        }
        if (requiresPrescription != null) {
            return medicineRepository.findByRequiresPrescription(requiresPrescription);
        }
        return medicineRepository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Medicine getMedicineById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));
    }
}
