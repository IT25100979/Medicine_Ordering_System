package com.mediorder.it25100979_delivery_management.controller;

import com.mediorder.it25100979_delivery_management.dto.request.*;
import com.mediorder.it25100979_delivery_management.dto.response.CourierAccountResponse;
import com.mediorder.it25100979_delivery_management.dto.response.DeliveryResponse;
import com.mediorder.it25100979_delivery_management.service.CourierAccountService;
import com.mediorder.it25100979_delivery_management.dto.response.DeliveryTimelineResponse;
import com.mediorder.it25100979_delivery_management.service.DeliveryService;
import com.mediorder.system_build_functions.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Delivery Management console for the Delivery Coordinator. */
@RestController
@RequestMapping({"/api/deliveries", "/api/v1/deliveries"})
@PreAuthorize("hasAnyRole('DELIVERY_COORDINATOR', 'ADMIN', 'SYSTEM_ADMIN')")
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final CourierAccountService courierAccountService;

    public DeliveryController(DeliveryService deliveryService, CourierAccountService courierAccountService) {
        this.deliveryService = deliveryService;
        this.courierAccountService = courierAccountService;
    }

    /** Courier logins and the company each one delivers for. */
    @GetMapping("/couriers")
    public ResponseEntity<ApiResponse<List<CourierAccountResponse>>> listCouriers() {
        return ResponseEntity.ok(ApiResponse.success("Courier accounts", courierAccountService.listCouriers()));
    }

    @PutMapping("/couriers/{userId}")
    public ResponseEntity<ApiResponse<CourierAccountResponse>> linkCourier(
            @PathVariable Long userId, @Valid @RequestBody LinkCourierRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Courier linked to " + request.getCourierCompany(),
                courierAccountService.linkCourier(userId, request.getCourierCompany())));
    }

    /** GET /api/v1/deliveries?status=PENDING */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DeliveryResponse>>> getAllDeliveries(
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success("Deliveries retrieved", deliveryService.getAllDeliveries(status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliveryResponse>> getDeliveryById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Delivery retrieved", deliveryService.getDeliveryById(id)));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<List<DeliveryTimelineResponse>>> getTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Delivery timeline retrieved", deliveryService.getTimeline(id)));
    }

    /** Record a delivery manually (e.g. phone order). It enters the approval queue as PENDING. */
    @PostMapping
    public ResponseEntity<ApiResponse<DeliveryResponse>> createDelivery(@Valid @RequestBody DeliveryCreationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Delivery recorded and waiting for approval", deliveryService.createDelivery(request)));
    }

    /** PENDING -> APPROVED */
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<DeliveryResponse>> approve(
            @PathVariable Long id, @Valid @RequestBody(required = false) DeliveryApprovalRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Delivery approved", deliveryService.approveDelivery(id, request)));
    }

    /** PENDING -> REJECTED (reason required) */
    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<DeliveryResponse>> reject(
            @PathVariable Long id, @Valid @RequestBody DeliveryRejectionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Delivery rejected", deliveryService.rejectDelivery(id, request)));
    }

    /** APPROVED -> DISPATCHED for one or many deliveries; issues the customer's OTP. */
    @PutMapping("/assign")
    public ResponseEntity<ApiResponse<List<DeliveryResponse>>> assignDeliveries(@Valid @RequestBody AssignDeliveryRequest request) {
        List<DeliveryResponse> assigned = deliveryService.assignDeliveries(request);
        return ResponseEntity.ok(ApiResponse.success(assigned.size() + " delivery(ies) assigned to courier", assigned));
    }

    /** HOLD / POSTPONE / TERMINATE / RESUME */
    @PutMapping("/{id}/action")
    public ResponseEntity<ApiResponse<DeliveryResponse>> performDeliveryAction(
            @PathVariable Long id, @Valid @RequestBody DeliveryActionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Action applied", deliveryService.performAction(id, request)));
    }

    @PostMapping("/{id}/regenerate-otp")
    public ResponseEntity<ApiResponse<DeliveryResponse>> regenerateOtp(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("A new OTP was sent to the customer", deliveryService.regenerateOtp(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDelivery(@PathVariable Long id) {
        deliveryService.deleteDelivery(id);
        return ResponseEntity.noContent().build();
    }
}
