package com.mediorder.it25100979_delivery_management.controller;

import com.mediorder.it25100979_delivery_management.dto.CourierDeliveryResponse;
import com.mediorder.it25100979_delivery_management.dto.CourierStatusUpdateRequest;
import com.mediorder.it25100979_delivery_management.service.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/courier", "/api/v1/courier"})
@CrossOrigin(origins = "*")
public class CourierController {

    @Autowired
    private DeliveryService deliveryService;

    /**
     * GET /api/courier/deliveries: Endpoint tailored strictly for couriers.
     * Only returns deliveryId/batchId, customerName (recipient), orderAddress, and customerPhone.
     */
    @GetMapping("/deliveries")
    public ResponseEntity<List<CourierDeliveryResponse>> getCourierDeliveries(
            @RequestParam(value = "courier", required = false) String courier) {
        return ResponseEntity.ok(deliveryService.getCourierDeliveries(courier));
    }

    /**
     * PUT /api/courier/deliveries/{id}/status: Endpoint for couriers to update delivery status.
     * - Allows direct updates to IN_TRANSIT and FAILED.
     * - Strictly requires a valid OTP in the request payload for DELIVERED.
     */
    @PutMapping("/deliveries/{id}/status")
    public ResponseEntity<CourierDeliveryResponse> updateCourierDeliveryStatus(
            @PathVariable Long id,
            @RequestBody CourierStatusUpdateRequest request) {
        return ResponseEntity.ok(deliveryService.updateCourierStatus(id, request));
    }
}
