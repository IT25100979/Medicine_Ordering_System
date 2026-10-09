package com.mediorder.it25100979_delivery_management.controller;

import com.mediorder.it25100979_delivery_management.dto.request.DispensePrescriptionRequest;
import com.mediorder.it25100979_delivery_management.dto.response.DeliveryResponse;
import com.mediorder.it25100979_delivery_management.service.PrescriptionDispenseService;
import com.mediorder.system_build_functions.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Pharmacist picks medicines (prescriptions and refills) and sends them to Delivery Management. */
@RestController
@RequestMapping("/api/v1/pharmacy")
@PreAuthorize("hasAnyRole('CHIEF_PHARMACIST', 'PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
public class PharmacyDispenseController {

    private final PrescriptionDispenseService dispenseService;

    public PharmacyDispenseController(PrescriptionDispenseService dispenseService) {
        this.dispenseService = dispenseService;
    }

    /** Which prescriptions already have an order (so the dashboard can show "Sent to delivery"). */
    @GetMapping("/prescriptions/dispensed")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> dispensed() {
        return ResponseEntity.ok(ApiResponse.success("Dispensed prescriptions", dispenseService.dispensedPrescriptions()));
    }

    @PostMapping("/prescriptions/{id}/dispense")
    public ResponseEntity<ApiResponse<DeliveryResponse>> dispense(
            @PathVariable Long id, @Valid @RequestBody DispensePrescriptionRequest request) {
        DeliveryResponse delivery = dispenseService.dispense(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Medicines picked and sent to Delivery Management as #DEL-" + delivery.getId(), delivery));
    }

    /** Send the next refill of a subscription (stock deducted, next refill date moves forward). */
    @PostMapping("/subscriptions/{id}/refill")
    public ResponseEntity<ApiResponse<DeliveryResponse>> refill(@PathVariable Long id) {
        DeliveryResponse delivery = dispenseService.dispenseRefill(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Refill picked and sent to Delivery Management as #DEL-" + delivery.getId(), delivery));
    }
}
