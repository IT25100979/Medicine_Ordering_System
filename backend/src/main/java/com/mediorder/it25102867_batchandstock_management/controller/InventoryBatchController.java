package com.mediorder.it25102867_batchandstock_management.controller;

import com.mediorder.it25102867_batchandstock_management.model.BatchStatus;
import com.mediorder.it25102867_batchandstock_management.model.InventoryBatch;
import com.mediorder.it25102867_batchandstock_management.service.InventoryBatchService;
import com.mediorder.system_build_functions.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/batches", "/api/batches"})
@CrossOrigin(origins = "*")
public class InventoryBatchController {

    @Autowired
    private InventoryBatchService inventoryBatchService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryBatch>>> getAllBatches(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long medicineId) {
        List<InventoryBatch> batches = inventoryBatchService.getAllBatches(status, medicineId);
        return ResponseEntity.ok(ApiResponse.success("Inventory batches retrieved", batches));
    }

    @GetMapping("/grouped")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getGroupedBatches() {
        List<Map<String, Object>> grouped = inventoryBatchService.getGroupedBatches();
        return ResponseEntity.ok(ApiResponse.success("Grouped inventory batches retrieved", grouped));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InventoryBatch>> getBatchById(@PathVariable Long id) {
        InventoryBatch batch = inventoryBatchService.getBatchById(id);
        return ResponseEntity.ok(ApiResponse.success("Inventory batch retrieved", batch));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<InventoryBatch>> createBatch(@RequestBody InventoryBatch batch) {
        InventoryBatch created = inventoryBatchService.createBatch(batch);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Inventory batch created", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<InventoryBatch>> updateBatch(
            @PathVariable Long id,
            @RequestBody InventoryBatch batch) {
        InventoryBatch updated = inventoryBatchService.updateBatch(id, batch);
        return ResponseEntity.ok(ApiResponse.success("Inventory batch updated", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteBatch(@PathVariable Long id) {
        inventoryBatchService.deleteBatch(id);
        return ResponseEntity.ok(ApiResponse.success("Inventory batch deleted", "Deleted successfully"));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<InventoryBatch>> updateStatus(
            @PathVariable Long id,
            @RequestParam BatchStatus status,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "system@mediorder.com";
        InventoryBatch updated = inventoryBatchService.updateBatchStatus(id, status, email);
        return ResponseEntity.ok(ApiResponse.success("Batch status updated", updated));
    }

    @PostMapping("/by-number/{batchNumber}/status")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<InventoryBatch>>> updateGroupStatus(
            @PathVariable String batchNumber,
            @RequestParam BatchStatus status,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "system@mediorder.com";
        List<InventoryBatch> updated = inventoryBatchService.updateBatchGroupByNumberStatus(batchNumber, status, email);
        return ResponseEntity.ok(ApiResponse.success("Batch group status updated", updated));
    }

    @PostMapping("/{id}/send-for-tagging")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<InventoryBatch>> sendForTagging(
            @PathVariable Long id,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "ops@mediorder.com";
        InventoryBatch updated = inventoryBatchService.sendBatchForTagging(id, email);
        return ResponseEntity.ok(ApiResponse.success("Batch item sent for condition tagging", updated));
    }

    @PostMapping("/by-number/{batchNumber}/send-for-tagging")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<InventoryBatch>>> sendGroupForTagging(
            @PathVariable String batchNumber,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "ops@mediorder.com";
        List<InventoryBatch> updated = inventoryBatchService.sendBatchGroupByNumberForTagging(batchNumber, email);
        return ResponseEntity.ok(ApiResponse.success("All items in batch sent for condition tagging", updated));
    }

    @PostMapping("/{id}/approve-live")
    @PreAuthorize("hasAnyRole('CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<InventoryBatch>> approveLive(
            @PathVariable Long id,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "pharmacist@mediorder.com";
        InventoryBatch updated = inventoryBatchService.approveBatchLive(id, email);
        return ResponseEntity.ok(ApiResponse.success("Batch item approved and marked LIVE", updated));
    }

    @PostMapping("/by-number/{batchNumber}/approve-live")
    @PreAuthorize("hasAnyRole('CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<InventoryBatch>>> approveGroupLive(
            @PathVariable String batchNumber,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "pharmacist@mediorder.com";
        List<InventoryBatch> updated = inventoryBatchService.approveBatchGroupByNumberLive(batchNumber, email);
        return ResponseEntity.ok(ApiResponse.success("All items in batch approved and marked LIVE", updated));
    }
}
