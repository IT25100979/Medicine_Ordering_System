package com.mediorder.controller;

import com.mediorder.dto.*;
import com.mediorder.model.OrderStatus;
import com.mediorder.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Order processing, state transitions, tracking, and cancellation")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @Operation(summary = "Place a new medicine order with FEFO stock allocation")
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse order = orderService.placeOrder(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(order, "Order placed successfully with FEFO batch allocation"));
    }

    @GetMapping
    @Operation(summary = "Get all orders, optionally filtered by user ID or status")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrders(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) OrderStatus status) {
        List<OrderResponse> orders = orderService.getAllOrders(userId, status);
        return ResponseEntity.ok(ApiResponse.ok(orders, "Orders retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details by internal ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.ok(order, "Order found"));
    }

    @GetMapping("/track/{orderNumber}")
    @Operation(summary = "Track order progress across fulfillment stages by order number")
    public ResponseEntity<ApiResponse<OrderResponse>> trackOrderByNumber(@PathVariable String orderNumber) {
        OrderResponse order = orderService.getOrderByOrderNumber(orderNumber);
        return ResponseEntity.ok(ApiResponse.ok(order, "Order tracking information retrieved"));
    }

    @GetMapping("/{id}/packing-slip")
    @Operation(summary = "Generate pharmacy packaging slip with allocated batch numbers and shelf locations")
    public ResponseEntity<ApiResponse<PackingSlipResponse>> getPackingSlip(@PathVariable Long id) {
        PackingSlipResponse slip = orderService.generatePackingSlip(id);
        return ResponseEntity.ok(ApiResponse.ok(slip, "Packing slip generated"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Advance order workflow state machine (Placed -> Verified -> Packed -> Out -> Delivered)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String actorId) {
        OrderResponse updated = orderService.updateOrderStatus(id, request.getNewStatus(), request.getNote(), actorId);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Order status advanced to " + request.getNewStatus()));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel order and automatically restock allocated batches back into active inventory")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody OrderCancellationRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String actorId) {
        OrderResponse cancelled = orderService.cancelOrder(id, request.getReason(), actorId);
        return ResponseEntity.ok(ApiResponse.ok(cancelled, "Order cancelled and batch stock restocked"));
    }
}
