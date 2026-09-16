package com.medilink.controller;

import com.medilink.entity.Batch;
import com.medilink.entity.Medicine;
import com.medilink.service.InventoryService;
import com.medilink.service.LowStockAlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired private InventoryService inventoryService;
    @Autowired private LowStockAlertService lowStockAlertService;

    // ---------- READ ----------

    @GetMapping("/medicines")
    public List<Medicine> getAllMedicines() {
        return inventoryService.getAllMedicines();
    }

    @GetMapping("/medicine/{medicineId}/stock")
    public List<Batch> getStock(@PathVariable Long medicineId) {
        return inventoryService.getStockLevels(medicineId);
    }

    @GetMapping("/medicine/{medicineId}/fefo-suggestion")
    public Batch getFefoSuggestion(@PathVariable Long medicineId,
                                   @RequestParam int qty) {
        return inventoryService.getFefoSuggestion(medicineId, qty);
    }

    @GetMapping("/low-stock-alerts")
    public List<Medicine> getLowStockAlerts() {
        return lowStockAlertService.getLowStockMedicines();
    }

    // ---------- CREATE ----------

    @PostMapping("/medicine")
    public Medicine createMedicine(@RequestBody Medicine medicine) {
        return inventoryService.createMedicine(medicine);
    }

    @PostMapping("/medicine/{medicineId}/batch")
    public Batch createBatch(@PathVariable Long medicineId, @RequestBody Batch batch) {
        return inventoryService.createBatch(medicineId, batch);
    }

    // ---------- UPDATE ----------

    @PutMapping("/medicine/{id}")
    public Medicine updateMedicine(@PathVariable Long id, @RequestBody Medicine medicine) {
        return inventoryService.updateMedicine(id, medicine);
    }

    @PutMapping("/batch/{id}")
    public Batch updateBatch(@PathVariable Long id, @RequestBody Batch batch) {
        return inventoryService.updateBatch(id, batch);
    }

    // ---------- DELETE ----------

    @DeleteMapping("/medicine/{id}")
    public void deleteMedicine(@PathVariable Long id) {
        inventoryService.deleteMedicine(id);
    }

    @DeleteMapping("/batch/{id}")
    public void deleteBatch(@PathVariable Long id) {
        inventoryService.deleteBatch(id);
    }
}