package com.mediorder.it25100979_delivery_management.designe_patter.observer;

import com.mediorder.it25100979_delivery_management.designe_patter.observer.impl.OrderStatusSyncObserver;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import com.mediorder.it25103946_order_processing_and_workflow.model.OrderStatus;
import com.mediorder.it25103946_order_processing_and_workflow.service.OrderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderStatusSyncObserverTest {

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderStatusSyncObserver observer;

    private void fire(Long orderId, DeliveryStatus from, DeliveryStatus to) {
        Delivery d = Delivery.builder().id(1L).orderId(orderId).status(to.name()).build();
        observer.update(DeliveryLifecycleEvent.of(DeliveryEventType.DELIVERY_APPROVED, d, from, null, null));
    }

    @Test
    void mapsDeliveryStatusToOrderStatus() {
        fire(10L, DeliveryStatus.PENDING, DeliveryStatus.APPROVED);
        fire(10L, DeliveryStatus.APPROVED, DeliveryStatus.DISPATCHED);
        fire(10L, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED);
        fire(10L, DeliveryStatus.PENDING, DeliveryStatus.REJECTED);

        verify(orderService).updateOrderStatus(10L, OrderStatus.PROCESSING);
        verify(orderService).updateOrderStatus(10L, OrderStatus.IN_TRANSIT);
        verify(orderService).updateOrderStatus(10L, OrderStatus.DELIVERED);
        verify(orderService).updateOrderStatus(10L, OrderStatus.CANCELLED);
    }

    @Test
    void ignoresDeliveriesWithoutOrderAndStatusesWithNoOrderEquivalent() {
        fire(null, DeliveryStatus.PENDING, DeliveryStatus.APPROVED);
        fire(10L, DeliveryStatus.DISPATCHED, DeliveryStatus.ON_HOLD);
        verify(orderService, never()).updateOrderStatus(anyLong(), any());
    }
}
