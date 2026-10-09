package com.mediorder.it25103725_subscription_management_and_refil_care.controller;

import com.mediorder.it25103725_subscription_management_and_refil_care.dto.CustomerSubscriptionRequest;
import com.mediorder.it25103725_subscription_management_and_refil_care.dto.SubscriptionRequest;
import com.mediorder.it25103725_subscription_management_and_refil_care.dto.SubscriptionView;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.Subscription;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionStatus;
import com.mediorder.it25103725_subscription_management_and_refil_care.service.SubscriptionService;
import com.mediorder.system_build_functions.dto.ApiResponse;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.security.CurrentUserProvider;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/subscriptions", "/api/v1/subscriptions"})
public class SubscriptionController {

    /** Staff who manage refills on behalf of customers. */
    private static final String STAFF =
            "hasAnyRole('CHIEF_PHARMACIST', 'PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER')";

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    // ---------------------------------------------------------- customer self-service

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<SubscriptionView>>> mySubscriptions() {
        User me = currentUserProvider.requireCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Your subscriptions", subscriptionService.getViewsForCustomer(me.getId())));
    }

    @PostMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<SubscriptionView>> subscribe(@Valid @RequestBody CustomerSubscriptionRequest request) {
        User me = currentUserProvider.requireCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Refill subscription created", subscriptionService.createForCustomer(me, request)));
    }

    /** status = ACTIVE (resume), PAUSED or CANCELLED. */
    @PatchMapping("/my/{id}/status")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<SubscriptionView>> changeMyStatus(@PathVariable Long id, @RequestParam SubscriptionStatus status) {
        User me = currentUserProvider.requireCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Subscription updated", subscriptionService.changeOwnStatus(me, id, status)));
    }

    // ---------------------------------------------------------- staff

    @GetMapping
    @PreAuthorize(STAFF)
    public ResponseEntity<List<SubscriptionView>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllViews());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subscription> getSubscriptionById(@PathVariable Long id) {
        return subscriptionService.getSubscriptionById(id)
                .map(sub -> {
                    requireOwnerOrStaff(sub.getCustomer() != null ? sub.getCustomer().getId() : null);
                    return ResponseEntity.ok(sub);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<SubscriptionView>> getCustomerSubscriptions(@PathVariable Long customerId) {
        requireOwnerOrStaff(customerId);
        return ResponseEntity.ok(subscriptionService.getViewsForCustomer(customerId));
    }

    @PostMapping
    @PreAuthorize(STAFF)
    public ResponseEntity<Subscription> createSubscription(@Valid @RequestBody SubscriptionRequest request) {
        return ResponseEntity.ok(subscriptionService.createSubscription(request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize(STAFF)
    public ResponseEntity<Subscription> updateStatus(@PathVariable Long id, @RequestParam SubscriptionStatus status) {
        return subscriptionService.updateStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/advance-cycle")
    @PreAuthorize(STAFF)
    public ResponseEntity<Subscription> advanceCycle(@PathVariable Long id) {
        return subscriptionService.advanceRefillCycle(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private void requireOwnerOrStaff(Long ownerId) {
        User me = currentUserProvider.requireCurrentUser();
        boolean owner = ownerId != null && ownerId.equals(me.getId());
        if (!owner && (me.getRole() == null || me.getRole() == Role.CUSTOMER)) {
            throw new AccessDeniedException("You can only view your own subscriptions.");
        }
    }
}
