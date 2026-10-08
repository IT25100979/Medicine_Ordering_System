package com.mediorder.it25100979_delivery_management.controller;

import com.mediorder.it25100979_delivery_management.dto.AssignDeliveryRequest;
import com.mediorder.it25100979_delivery_management.dto.DeliveryActionRequest;
import com.mediorder.it25100979_delivery_management.dto.DeliveryCreationRequest;
import com.mediorder.it25100979_delivery_management.model.Delivery;
import com.mediorder.it25100979_delivery_management.service.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/deliveries", "/api/v1/deliveries"})
@CrossOrigin(origins = "*")
public class DeliveryController {

    @Autowired
    private DeliveryService deliveryService;

    /**
     * POST /api/deliveries: Receive new deliveries from customers, show related entities, and persist them.
     */
    @PostMapping
    public ResponseEntity<Delivery> createDelivery(@RequestBody DeliveryCreationRequest request) {
        Delivery created = deliveryService.createDelivery(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /api/deliveries: List all deliveries with optional status filter.
     */
    @GetMapping
    public ResponseEntity<List<Delivery>> getAllDeliveries(@RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(deliveryService.getAllDeliveries(status));
    }

    /**
     * GET /api/deliveries/{id}: Get single delivery details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Delivery> getDeliveryById(@PathVariable Long id) {
        return ResponseEntity.ok(deliveryService.getDeliveryById(id));
    }

    /**
     * PUT /api/deliveries/assign: Select single or batch deliveries and assign route and courier.
     * Transitions status from PENDING to DISPATCHED.
     */
    @PutMapping("/assign")
    public ResponseEntity<List<Delivery>> assignDeliveries(@RequestBody AssignDeliveryRequest request) {
        return ResponseEntity.ok(deliveryService.assignDeliveries(request));
    }

    /**
     * PUT /api/deliveries/{id}/action: Perform specific actions (TERMINATE, HOLD, POSTPONE).
     */
    @PutMapping("/{id}/action")
    public ResponseEntity<Delivery> performDeliveryAction(@PathVariable Long id, @RequestBody DeliveryActionRequest request) {
        return ResponseEntity.ok(deliveryService.performAction(id, request));
    }

    /**
     * Backward-compatible status update endpoint
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Delivery> updateDeliveryStatus(@PathVariable Long id, @RequestBody Map<String, String> statusUpdate) {
        String status = statusUpdate != null ? statusUpdate.get("status") : "PENDING";
        return ResponseEntity.ok(deliveryService.updateDeliveryStatus(id, status));
    }

    /**
     * DELETE /api/deliveries/{id}: Delete a delivery.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDelivery(@PathVariable Long id) {
        deliveryService.deleteDelivery(id);
        return ResponseEntity.noContent().build();
    }
}
