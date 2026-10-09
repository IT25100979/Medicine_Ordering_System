package com.mediorder.it25100979_delivery_management.controller;

import com.mediorder.it25100979_delivery_management.dto.request.CourierStatusUpdateRequest;
import com.mediorder.it25100979_delivery_management.dto.response.CourierAccountResponse;
import com.mediorder.it25100979_delivery_management.dto.response.CourierDeliveryResponse;
import com.mediorder.it25100979_delivery_management.exception.DeliveryNotFoundException;
import com.mediorder.it25100979_delivery_management.service.CourierAccountService;
import com.mediorder.it25100979_delivery_management.service.DeliveryService;
import com.mediorder.system_build_functions.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Courier work queue: only parcels already assigned to a courier; no OTP or totals exposed.
 * A courier login (DELIVERY_RIDER) only ever sees and updates its own company's parcels.
 */
@RestController
@RequestMapping({"/api/courier", "/api/v1/courier"})
@PreAuthorize("hasAnyRole('DELIVERY_RIDER', 'DELIVERY_COORDINATOR', 'ADMIN', 'SYSTEM_ADMIN')")
public class CourierController {

    private final DeliveryService deliveryService;
    private final CourierAccountService courierAccountService;

    public CourierController(DeliveryService deliveryService, CourierAccountService courierAccountService) {
        this.deliveryService = deliveryService;
        this.courierAccountService = courierAccountService;
    }

    /** Who am I and which company do I deliver for (used by the courier UI). */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CourierAccountResponse>> me() {
        return ResponseEntity.ok(ApiResponse.success("Courier account", courierAccountService.me()));
    }

    @GetMapping("/deliveries")
    public ResponseEntity<ApiResponse<List<CourierDeliveryResponse>>> getCourierDeliveries(
            @RequestParam(value = "courier", required = false) String courier) {
        // a courier's own company always wins over whatever filter the client sends
        String company = courierAccountService.restrictedCompanyForCaller().orElse(courier);
        return ResponseEntity.ok(ApiResponse.success("Courier deliveries", deliveryService.getCourierDeliveries(company)));
    }

    /** IN_TRANSIT (picked up), FAILED (reason) or DELIVERED (requires the customer's 6-digit OTP). */
    @PutMapping("/deliveries/{id}/status")
    public ResponseEntity<ApiResponse<CourierDeliveryResponse>> updateCourierDeliveryStatus(
            @PathVariable Long id, @Valid @RequestBody CourierStatusUpdateRequest request) {
        courierAccountService.restrictedCompanyForCaller().ifPresent(company -> {
            if (!company.equals(deliveryService.getDeliveryById(id).getAssignedCourier())) {
                throw new DeliveryNotFoundException(id); // not in this courier's queue
            }
        });
        return ResponseEntity.ok(ApiResponse.success("Delivery status updated", deliveryService.updateCourierStatus(id, request)));
    }
}
