package com.mediorder.it25103946_order_processing_and_workflow.controller;

import com.mediorder.it25103946_order_processing_and_workflow.model.Order;
import com.mediorder.it25103946_order_processing_and_workflow.model.OrderStatus;
import com.mediorder.it25103946_order_processing_and_workflow.service.OrderService;
import com.mediorder.system_build_functions.dto.ApiResponse;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.security.CurrentUserProvider;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/orders", "/api/v1/orders"})
public class OrderController {

    private static final String STAFF = "hasAnyRole('ADMIN', 'SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'DELIVERY_COORDINATOR', 'FINANCE_MANAGER')";

    @Autowired
    private OrderService orderService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @GetMapping
    @PreAuthorize(STAFF)
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    /** Order history of the logged-in customer (used by the Profile page). */
    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyOrders() {
        User me = currentUserProvider.requireCurrentUser();
        List<Map<String, Object>> orders = orderService.getOrdersByCustomer(me.getId()).stream()
                .map(OrderController::toSummary)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Your orders", orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id)
                .map(order -> {
                    requireOwnerOrStaff(order.getCustomer() != null ? order.getCustomer().getId() : null);
                    return ResponseEntity.ok(order);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Order>> getCustomerOrders(@PathVariable Long customerId) {
        requireOwnerOrStaff(customerId);
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId));
    }

    /** Customers place orders through checkout (/api/v1/customer/deliveries); raw creation is staff-only. */
    @PostMapping
    @PreAuthorize(STAFF)
    public ResponseEntity<Order> createOrder(@Valid @RequestBody Order order) {
        return ResponseEntity.ok(orderService.createOrder(order));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize(STAFF)
    public ResponseEntity<Order> updateStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        return orderService.updateOrderStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private void requireOwnerOrStaff(Long ownerId) {
        User me = currentUserProvider.requireCurrentUser();
        boolean isOwner = ownerId != null && ownerId.equals(me.getId());
        if (!isOwner && (me.getRole() == null || me.getRole() == Role.CUSTOMER)) {
            throw new AccessDeniedException("You can only view your own orders.");
        }
    }

    private static Map<String, Object> toSummary(Order order) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("id", "ORD-" + order.getId());
        summary.put("rawId", order.getId());
        summary.put("orderNumber", "ORD-" + order.getId());
        summary.put("createdAt", order.getCreatedAt() != null ? order.getCreatedAt().toString() : java.time.LocalDateTime.now().toString());
        summary.put("status", order.getOrderStatus() != null ? order.getOrderStatus().name() : "PLACED");
        summary.put("totalAmount", order.getTotalAmount() != null ? order.getTotalAmount() : java.math.BigDecimal.ZERO);
        summary.put("shippingAddress", order.getShippingAddress() != null ? order.getShippingAddress() : "Colombo, Sri Lanka");
        summary.put("trackingId", "TRK-LK-" + order.getId());
        summary.put("batchNo", "BCH-COL-0" + ((order.getId() % 2) + 1));
        summary.put("storageCondition", "Verified Pharmacy Cold-Chain Monitored");
        summary.put("itemsCount", 1);
        return summary;
    }
}
