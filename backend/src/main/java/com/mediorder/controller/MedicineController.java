package com.mediorder.controller;

import com.mediorder.model.Medicine;
import com.mediorder.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/medicines", "/api/medicines"})
@CrossOrigin(origins = "*")
public class MedicineController {

    @Autowired
    private MedicineService medicineService;

    @GetMapping
    public ResponseEntity<List<Medicine>> getAllMedicines(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "requiresPrescription", required = false) Boolean requiresPrescription) {
        return ResponseEntity.ok(medicineService.getAllMedicines(search, category, requiresPrescription));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER')")
    public ResponseEntity<Map<String, Object>> getCatalogStats() {
        return ResponseEntity.ok(medicineService.getCatalogStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Medicine> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.getMedicineById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN')")
    public ResponseEntity<Medicine> createMedicine(@RequestBody Medicine medicine) {
        Medicine created = medicineService.createMedicine(medicine);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN')")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Long id, @RequestBody Medicine medicine) {
        Medicine updated = medicineService.updateMedicine(id, medicine);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN')")
    public ResponseEntity<Map<String, String>> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok(Map.of("message", "Medicine with ID " + id + " has been successfully removed from the catalog."));
    }

    @PostMapping("/batch-price-update")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER')")
    public ResponseEntity<Map<String, Object>> batchPriceUpdate(
            @RequestParam BigDecimal percentageChange,
            @RequestParam(required = false) String category) {
        int updatedCount = medicineService.batchPriceUpdate(percentageChange, category);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully adjusted prices by " + percentageChange + "%",
                "affectedCount", updatedCount
        ));
    }
}
