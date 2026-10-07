package com.mediorder.it25101882_cold_chain_tagging.controller;

import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainRequest;
import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainTelemetryRequest;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainDelivery;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainTelemetry;
import com.mediorder.it25101882_cold_chain_tagging.service.ColdChainService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Cold-Chain Handling & Age-Verification Security Protocols.
 * Base Endpoints: /api/cold-chain, /api/v1/cold-chain
 */
@RestController
@RequestMapping({"/api/cold-chain", "/api/v1/cold-chain"})
@CrossOrigin(origins = "*")
public class ColdChainController {

    private final ColdChainService service;

    public ColdChainController(ColdChainService service) {
        this.service = service;
    }

    // ====================================================================
    // COLD CHAIN DELIVERY CRUD ENDPOINTS (Used by React ColdChainPage)
    // ====================================================================

    /**
     * 1. READ ALL: Retrieve all cold-chain delivery records.
     * GET /api/cold-chain
     */
    @GetMapping
    public ResponseEntity<List<ColdChainDelivery>> getAllDeliveries() {
        List<ColdChainDelivery> deliveries = service.getAllDeliveries();
        return ResponseEntity.ok(deliveries);
    }

    /**
     * 2. READ ONE: Retrieve details of a single cold-chain delivery record by ID.
     * GET /api/cold-chain/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ColdChainDelivery> getDeliveryById(@PathVariable Long id) {
        ColdChainDelivery delivery = service.getDeliveryById(id);
        return ResponseEntity.ok(delivery);
    }

    /**
     * 3. CREATE: Add a new cold-chain delivery / security record.
     * POST /api/cold-chain
     */
    @PostMapping
    public ResponseEntity<ColdChainDelivery> createDelivery(@Valid @RequestBody ColdChainRequest request) {
        ColdChainDelivery created = service.createDelivery(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * 4. UPDATE: Update an existing cold-chain delivery / security record.
     * PUT /api/cold-chain/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ColdChainDelivery> updateDelivery(
            @PathVariable Long id, 
            @Valid @RequestBody ColdChainRequest request) {
        ColdChainDelivery updated = service.updateDelivery(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * 5. DELETE: Remove a cold-chain delivery record by ID.
     * DELETE /api/cold-chain/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteDelivery(@PathVariable Long id) {
        service.deleteDelivery(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Cold-chain delivery record with ID " + id + " deleted successfully.");
        return ResponseEntity.ok(response);
    }

    // ====================================================================
    // TELEMETRY SUB-ENDPOINTS (Preserved for compatibility)
    // ====================================================================

    @GetMapping("/telemetry")
    public ResponseEntity<List<ColdChainTelemetry>> getAllTelemetry() {
        return ResponseEntity.ok(service.getAllTelemetry());
    }

    @GetMapping("/delivery/{deliveryId}")
    public ResponseEntity<List<ColdChainTelemetry>> getDeliveryTelemetry(@PathVariable Long deliveryId) {
        return ResponseEntity.ok(service.getTelemetryByDelivery(deliveryId));
    }

    @GetMapping("/breaches")
    public ResponseEntity<List<ColdChainTelemetry>> getBreachedTelemetry() {
        return ResponseEntity.ok(service.getBreachedTelemetry());
    }

    @PostMapping("/telemetry")
    public ResponseEntity<ColdChainTelemetry> recordTelemetry(@RequestBody ColdChainTelemetryRequest request) {
        return ResponseEntity.ok(service.recordTelemetry(request));
    }
}
