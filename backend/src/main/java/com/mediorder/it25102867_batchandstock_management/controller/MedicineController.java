package com.mediorder.it25102867_batchandstock_management.controller;

import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.service.MedicineService;
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
    @PreAuthorize("hasRole('OPERATIONS_MANAGER')")
    public ResponseEntity<Medicine> createMedicine(@RequestBody Medicine medicine) {
        Medicine created = medicineService.createMedicine(medicine);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER')")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Long id, @RequestBody Medicine medicine) {
        Medicine updated = medicineService.updateMedicine(id, medicine);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER')")
    public ResponseEntity<Map<String, String>> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok(Map.of("message", "Medicine with ID " + id + " has been successfully removed from the catalog."));
    }

    @PostMapping("/batch-price-update")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> batchPriceUpdate(
            @RequestParam BigDecimal percentageChange,
            @RequestParam(required = false) String category) {
        int updatedCount = medicineService.batchPriceUpdate(percentageChange, category);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully adjusted prices by " + percentageChange + "%",
                "affectedCount", updatedCount
        ));
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'ADMIN')")
    public ResponseEntity<Medicine> quickAdjustStock(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Medicine updated = medicineService.quickAdjustStock(id, updates);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'ADMIN')")
    public ResponseEntity<Medicine> quickAdjustStockPut(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Medicine updated = medicineService.quickAdjustStock(id, updates);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/quarantine")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'ADMIN')")
    public ResponseEntity<Medicine> toggleQuarantine(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        Boolean quarantined = body != null && body.containsKey("isQuarantined")
                ? Boolean.valueOf(String.valueOf(body.get("isQuarantined")))
                : null;
        String reason = body != null && body.containsKey("reason")
                ? String.valueOf(body.get("reason"))
                : "Operational inspection";
        Medicine updated = medicineService.toggleQuarantine(id, quarantined, reason);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/reorder")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> reorderStock(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            java.security.Principal principal) {
        Integer quantity = body != null && body.containsKey("quantity") && body.get("quantity") != null
                ? Integer.valueOf(String.valueOf(body.get("quantity")))
                : null;
        String notes = body != null && body.containsKey("notes")
                ? String.valueOf(body.get("notes"))
                : "";
        String userEmail = principal != null ? principal.getName() : "system";
        Map<String, Object> po = medicineService.createReorderPO(id, quantity, notes, userEmail);
        return ResponseEntity.ok(po);
    }
}


