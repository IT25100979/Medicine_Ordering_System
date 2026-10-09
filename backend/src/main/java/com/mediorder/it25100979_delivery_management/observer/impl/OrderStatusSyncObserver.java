package com.mediorder.it25100979_delivery_management.observer.impl;

import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import com.mediorder.it25100979_delivery_management.observer.DeliveryObserver;
import com.mediorder.it25103946_order_processing_and_workflow.model.OrderStatus;
import com.mediorder.it25103946_order_processing_and_workflow.service.OrderService;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Keeps the linked order (Order Processing module) in step with its delivery,
 * inside the same database transaction as the delivery change.
 */
@Component
@Order(2)
public class OrderStatusSyncObserver implements DeliveryObserver {

    private final OrderService orderService;

    public OrderStatusSyncObserver(OrderService orderService) {
        this.orderService = orderService;
    }

    @Override
    public void update(DeliveryLifecycleEvent event) {
        Long orderId = event.delivery().getOrderId();
        if (orderId == null || !event.statusChanged()) {
            return;
        }
        OrderStatus orderStatus = switch (event.newStatus()) {
            case APPROVED -> OrderStatus.PROCESSING;
            case DISPATCHED, IN_TRANSIT -> OrderStatus.IN_TRANSIT;
            case DELIVERED -> OrderStatus.DELIVERED;
            case REJECTED, TERMINATED -> OrderStatus.CANCELLED;
            default -> null; // PENDING, ON_HOLD, POSTPONED, FAILED keep the order as it is
        };
        if (orderStatus != null) {
            orderService.updateOrderStatus(orderId, orderStatus);
        }
    }

    @Override
    public boolean isCritical() {
        return true;
    }
}
