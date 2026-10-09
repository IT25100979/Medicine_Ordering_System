package com.mediorder.it25100979_delivery_management.controller;

import com.mediorder.it25100979_delivery_management.dto.request.CourierStatusUpdateRequest;
import com.mediorder.it25100979_delivery_management.dto.response.CourierDeliveryResponse;
import com.mediorder.it25100979_delivery_management.service.DeliveryService;
import com.mediorder.system_build_functions.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Courier work queue: only parcels already assigned to a courier; no OTP or totals exposed. */
@RestController
@RequestMapping({"/api/courier", "/api/v1/courier"})
@PreAuthorize("hasAnyRole('DELIVERY_RIDER', 'DELIVERY_COORDINATOR', 'ADMIN', 'SYSTEM_ADMIN')")
public class CourierController {

    private final DeliveryService deliveryService;

    public CourierController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @GetMapping("/deliveries")
    public ResponseEntity<ApiResponse<List<CourierDeliveryResponse>>> getCourierDeliveries(
            @RequestParam(value = "courier", required = false) String courier) {
        return ResponseEntity.ok(ApiResponse.success("Courier deliveries", deliveryService.getCourierDeliveries(courier)));
    }

    /** IN_TRANSIT (picked up), FAILED (reason) or DELIVERED (requires the customer's 4-digit OTP: 1234). */
    @PutMapping("/deliveries/{id}/status")
    public ResponseEntity<ApiResponse<CourierDeliveryResponse>> updateCourierDeliveryStatus(
            @PathVariable Long id, @Valid @RequestBody CourierStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Delivery status updated", deliveryService.updateCourierStatus(id, request)));
    }
}
