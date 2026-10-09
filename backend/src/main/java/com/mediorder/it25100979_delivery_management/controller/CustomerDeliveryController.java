package com.mediorder.it25100979_delivery_management.controller;

import com.mediorder.it25100979_delivery_management.dto.request.CustomerDeliveryRequest;
import com.mediorder.it25100979_delivery_management.dto.response.CourierPartnerResponse;
import com.mediorder.it25100979_delivery_management.dto.response.CustomerDeliveryResponse;
import com.mediorder.it25100979_delivery_management.service.CustomerDeliveryService;
import com.mediorder.system_build_functions.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Customer checkout (choose courier partner + confirm) and delivery tracking. */
@RestController
@RequestMapping("/api/v1/customer/deliveries")
public class CustomerDeliveryController {

    private final CustomerDeliveryService customerDeliveryService;

    public CustomerDeliveryController(CustomerDeliveryService customerDeliveryService) {
        this.customerDeliveryService = customerDeliveryService;
    }

    /** Public: courier partners the customer can pick from at checkout. */
    @GetMapping("/courier-partners")
    public ResponseEntity<ApiResponse<List<CourierPartnerResponse>>> courierPartners() {
        return ResponseEntity.ok(ApiResponse.success("Courier partners", customerDeliveryService.getCourierPartners()));
    }

    /** Customer confirms the order with the selected courier partner -> PENDING delivery for approval. */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerDeliveryResponse>> requestDelivery(
            @Valid @RequestBody CustomerDeliveryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Order placed. Your delivery is waiting for approval.", customerDeliveryService.requestDelivery(request)));
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<CustomerDeliveryResponse>>> myDeliveries() {
        return ResponseEntity.ok(ApiResponse.success("Your deliveries", customerDeliveryService.getMyDeliveries()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerDeliveryResponse>> myDelivery(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Delivery details", customerDeliveryService.getMyDelivery(id)));
    }
}
