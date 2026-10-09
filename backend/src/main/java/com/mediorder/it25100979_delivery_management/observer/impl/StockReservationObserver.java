package com.mediorder.it25100979_delivery_management.observer.impl;

import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import com.mediorder.it25100979_delivery_management.observer.DeliveryObserver;
import com.mediorder.it25102867_batchandstock_management.service.FefoAllocationService;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Batch & Stock integration: stock reserved at checkout is
 * deducted for good when the parcel is DELIVERED and returned to the shelf when the
 * delivery is REJECTED or TERMINATED. Runs in the same transaction as the delivery change.
 */
@Component
@Order(3)
public class StockReservationObserver implements DeliveryObserver {

    private final FefoAllocationService fefoAllocationService;

    public StockReservationObserver(FefoAllocationService fefoAllocationService) {
        this.fefoAllocationService = fefoAllocationService;
    }

    @Override
    public void update(DeliveryLifecycleEvent event) {
        Long orderId = event.delivery().getOrderId();
        if (orderId == null || !event.statusChanged()) {
            return;
        }
        switch (event.newStatus()) {
            case DELIVERED -> fefoAllocationService.confirmOrderStock(orderId);
            case REJECTED, TERMINATED -> fefoAllocationService.releaseOrderStock(orderId);
            default -> {
                // still in progress (FAILED can be re-dispatched, so stock stays reserved)
            }
        }
    }

    @Override
    public boolean isCritical() {
        return true;
    }
}
