package com.mediorder.controller;

import com.mediorder.dto.*;
import com.mediorder.model.BatchStatus;
import com.mediorder.service.SmartInventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/inventory", "/api/inventory"})
@CrossOrigin(origins = "*")
public class InventoryController {

    private final SmartInventoryService inventoryService;

    public InventoryController(SmartInventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/stats")
    public ResponseEntity<SmartInventoryStatsResponse> getInventoryStats() {
        return ResponseEntity.ok(inventoryService.getStats());
    }

    @GetMapping("/batches")
    public ResponseEntity<List<BatchResponse>> getAllBatches(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BatchStatus status,
            @RequestParam(required = false) String urgency) {
        return ResponseEntity.ok(inventoryService.getAllBatches(search, status, urgency));
    }

    @GetMapping("/batches/medicine/{medicineId}")
    public ResponseEntity<List<BatchResponse>> getBatchesForMedicine(@PathVariable Long medicineId) {
        return ResponseEntity.ok(inventoryService.getBatchesForMedicine(medicineId));
    }

    @PostMapping("/batches")
    public ResponseEntity<BatchResponse> addBatch(@Valid @RequestBody BatchRequest request) {
        BatchResponse created = inventoryService.addBatch(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/batches/{id}")
    public ResponseEntity<BatchResponse> updateBatch(
            @PathVariable Long id,
            @Valid @RequestBody BatchRequest request) {
        return ResponseEntity.ok(inventoryService.updateBatch(id, request));
    }

    @PutMapping("/batches/{id}/status")
    public ResponseEntity<BatchResponse> updateBatchStatus(
            @PathVariable Long id,
            @Valid @RequestBody BatchStatusUpdateRequest request) {
        return ResponseEntity.ok(inventoryService.updateBatchStatus(id, request));
    }

    @DeleteMapping("/batches/{id}")
    public ResponseEntity<Map<String, String>> deleteBatch(@PathVariable Long id) {
        inventoryService.deleteBatch(id);
        return ResponseEntity.ok(Map.of("message", "Batch ID " + id + " has been successfully removed from inventory."));
    }

    @PostMapping("/fefo/simulate")
    public ResponseEntity<FefoSimulationResponse> simulateFefoAllocation(
            @Valid @RequestBody FefoSimulationRequest request) {
        return ResponseEntity.ok(inventoryService.simulateFefoAllocation(
                request.getMedicineId(),
                request.getRequestedQuantity()
        ));
    }

    @PostMapping("/fefo/deduct")
    public ResponseEntity<FefoSimulationResponse> executeFefoDeduction(
            @Valid @RequestBody FefoSimulationRequest request) {
        return ResponseEntity.ok(inventoryService.executeFefoDeduction(
                request.getMedicineId(),
                request.getRequestedQuantity()
        ));
    }
}
