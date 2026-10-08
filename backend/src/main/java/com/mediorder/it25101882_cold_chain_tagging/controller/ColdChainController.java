package com.mediorder.it25101882_cold_chain_tagging.controller;

import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainTelemetryRequest;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainTelemetry;
import com.mediorder.it25101882_cold_chain_tagging.service.ColdChainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/cold-chain", "/api/v1/cold-chain"})
@CrossOrigin(origins = "*")
public class ColdChainController {

    @Autowired
    private ColdChainService coldChainService;

    @GetMapping
    public ResponseEntity<List<ColdChainTelemetry>> getAllTelemetry() {
        return ResponseEntity.ok(coldChainService.getAllTelemetry());
    }

    @GetMapping("/delivery/{deliveryId}")
    public ResponseEntity<List<ColdChainTelemetry>> getDeliveryTelemetry(@PathVariable Long deliveryId) {
        return ResponseEntity.ok(coldChainService.getTelemetryByDelivery(deliveryId));
    }

    @GetMapping("/breaches")
    public ResponseEntity<List<ColdChainTelemetry>> getBreachedTelemetry() {
        return ResponseEntity.ok(coldChainService.getBreachedTelemetry());
    }

    @PostMapping("/telemetry")
    public ResponseEntity<ColdChainTelemetry> recordTelemetry(@RequestBody ColdChainTelemetryRequest request) {
        return ResponseEntity.ok(coldChainService.recordTelemetry(request));
    }
}
