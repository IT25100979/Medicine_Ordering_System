package com.mediorder.it25103725_subscription_management_and_refil_care.controller;

import com.mediorder.it25103725_subscription_management_and_refil_care.dto.SubscriptionRequest;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.Subscription;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionStatus;
import com.mediorder.it25103725_subscription_management_and_refil_care.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/subscriptions", "/api/v1/subscriptions"})
@CrossOrigin(origins = "*")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<List<Subscription>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subscription> getSubscriptionById(@PathVariable Long id) {
        return subscriptionService.getSubscriptionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Subscription>> getCustomerSubscriptions(@PathVariable Long customerId) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionsByCustomer(customerId));
    }

    @PostMapping
    public ResponseEntity<Subscription> createSubscription(@jakarta.validation.Valid @RequestBody SubscriptionRequest request) {
        return ResponseEntity.ok(subscriptionService.createSubscription(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Subscription> updateStatus(@PathVariable Long id, @RequestParam SubscriptionStatus status) {
        return subscriptionService.updateStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/advance-cycle")
    public ResponseEntity<Subscription> advanceCycle(@PathVariable Long id) {
        return subscriptionService.advanceRefillCycle(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
