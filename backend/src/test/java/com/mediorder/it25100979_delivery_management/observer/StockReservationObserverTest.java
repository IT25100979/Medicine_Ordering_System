package com.mediorder.it25100979_delivery_management.observer;

import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import com.mediorder.it25100979_delivery_management.observer.impl.StockReservationObserver;
import com.mediorder.it25102867_batchandstock_management.service.FefoAllocationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockReservationObserverTest {

    @Mock
    private FefoAllocationService fefoAllocationService;

    @InjectMocks
    private StockReservationObserver observer;

    private void fire(DeliveryStatus from, DeliveryStatus to) {
        Delivery d = Delivery.builder().id(1L).orderId(77L).status(to.name()).build();
        observer.update(DeliveryLifecycleEvent.of(DeliveryEventType.DELIVERED, d, from, null, null));
    }

    @Test
    void deliveredDeductsReservedStock() {
        fire(DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED);
        verify(fefoAllocationService).confirmOrderStock(77L);
    }

    @Test
    void rejectedOrTerminatedReturnsStock() {
        fire(DeliveryStatus.PENDING, DeliveryStatus.REJECTED);
        fire(DeliveryStatus.APPROVED, DeliveryStatus.TERMINATED);
        verify(fefoAllocationService, times(2)).releaseOrderStock(77L);
    }

    @Test
    void inProgressStatusesKeepTheReservation() {
        fire(DeliveryStatus.PENDING, DeliveryStatus.APPROVED);
        fire(DeliveryStatus.IN_TRANSIT, DeliveryStatus.FAILED);
        verify(fefoAllocationService, never()).confirmOrderStock(anyLong());
        verify(fefoAllocationService, never()).releaseOrderStock(anyLong());
    }
}
