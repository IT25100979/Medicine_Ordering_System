package com.mediorder.controller;

import com.mediorder.dto.*;
import com.mediorder.model.BatchStatus;
import com.mediorder.model.Medicine;
import com.mediorder.repository.InventoryBatchRepository;
import com.mediorder.repository.MedicineRepository;
import com.mediorder.service.FefoAllocationService;
import com.mediorder.service.InventoryBatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory & FEFO", description = "Batch registration, FEFO allocation engine, quarantine, and stock levels")
public class InventoryController {

    private final InventoryBatchService batchService;
    private final FefoAllocationService fefoAllocationService;
    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository batchRepository;

    public InventoryController(InventoryBatchService batchService,
                               FefoAllocationService fefoAllocationService,
                               MedicineRepository medicineRepository,
                               InventoryBatchRepository batchRepository) {
        this.batchService = batchService;
        this.fefoAllocationService = fefoAllocationService;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
    }

    @GetMapping("/batches")
    @Operation(summary = "List all inventory batches with shelf life and quarantine status")
    public ResponseEntity<ApiResponse<List<BatchResponse>>> getBatches(
            @RequestParam(required = false) Long medicineId,
            @RequestParam(required = false) BatchStatus status) {
        List<BatchResponse> batches = batchService.getAllBatches(medicineId, status);
        return ResponseEntity.ok(ApiResponse.ok(batches, "Inventory batches retrieved"));
    }

    @PostMapping("/batches")
    @Operation(summary = "Register a new manufacturer batch into pharmacy inventory")
    public ResponseEntity<ApiResponse<BatchResponse>> registerBatch(
            @Valid @RequestBody BatchRegistrationRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String actorId) {
        BatchResponse batch = batchService.registerBatch(request, actorId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(batch, "Batch registered successfully"));
    }

    @GetMapping("/batches/{id}")
    @Operation(summary = "Get batch by ID")
    public ResponseEntity<ApiResponse<BatchResponse>> getBatchById(@PathVariable Long id) {
        BatchResponse batch = batchService.getBatchById(id);
        return ResponseEntity.ok(ApiResponse.ok(batch, "Batch found"));
    }

    @PostMapping("/allocate-fefo")
    @Operation(summary = "Simulate non-destructive FEFO stock allocation for an order request")
    public ResponseEntity<ApiResponse<FefoAllocationPreviewResponse>> previewFefoAllocation(
            @Valid @RequestBody FefoAllocationPreviewRequest request) {
        FefoAllocationPreviewResponse preview = fefoAllocationService.previewFefoAllocation(
                request.getMedicineId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.ok(preview, "FEFO allocation preview generated"));
    }

    @PatchMapping("/batches/{id}/quarantine")
    @Operation(summary = "Lock and quarantine a batch from active dispensing")
    public ResponseEntity<ApiResponse<BatchResponse>> quarantineBatch(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Manual quarantine by pharmacy staff") String reason,
            @RequestHeader(value = "X-User-Id", required = false) String actorId) {
        BatchResponse batch = batchService.quarantineBatch(id, reason, actorId);
        return ResponseEntity.ok(ApiResponse.ok(batch, "Batch has been quarantined and locked from active orders"));
    }

    @PatchMapping("/batches/{id}/release")
    @Operation(summary = "Release a batch from quarantine back to active status")
    public ResponseEntity<ApiResponse<BatchResponse>> releaseQuarantine(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String actorId) {
        BatchResponse batch = batchService.releaseQuarantine(id, actorId);
        return ResponseEntity.ok(ApiResponse.ok(batch, "Batch released from quarantine"));
    }

    @PostMapping("/run-expiry-check")
    @Operation(summary = "Trigger automated nightly expiry and near-expiry batch quarantine sweep")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runExpiryCheck() {
        int count = batchService.autoQuarantineExpiredBatches();
        Map<String, Object> data = new HashMap<>();
        data.put("expiredBatchesLocked", count);
        data.put("executedAt", new Date());
        return ResponseEntity.ok(ApiResponse.ok(data, "Automated expiry check complete. Expired batches locked."));
    }

    @GetMapping("/medicines")
    @Operation(summary = "Get medicine catalog with active non-quarantined stock counts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMedicinesWithStock() {
        List<Medicine> medicines = medicineRepository.findByIsActiveTrue();
        LocalDate today = LocalDate.now();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Medicine med : medicines) {
            int availableStock = batchRepository.sumAvailableStock(
                    med.getId(),
                    Arrays.asList(BatchStatus.ACTIVE, BatchStatus.NEAR_EXPIRY),
                    today
            );

            Map<String, Object> map = new HashMap<>();
            map.put("id", med.getId());
            map.put("name", med.getName());
            map.put("genericName", med.getGenericName());
            map.put("category", med.getCategory());
            map.put("dosage", med.getDosage());
            map.put("unitPrice", med.getUnitPrice());
            map.put("requiresPrescription", med.isRequiresPrescription());
            map.put("reorderThreshold", med.getReorderThreshold());
            map.put("availableStock", availableStock);
            map.put("isLowStock", availableStock <= med.getReorderThreshold());
            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result, "Medicine stock catalog retrieved"));
    }
}
