package com.mediorder.it25100979_delivery_management.observer.impl;

import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import com.mediorder.it25100979_delivery_management.observer.AfterCommit;
import com.mediorder.it25100979_delivery_management.observer.DeliveryObserver;
import com.mediorder.system_build_functions.service.AuditService;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Writes each delivery event to the system-wide audit log (visible in the System Admin console). */
@Component
@Order(4)
public class DeliveryAuditObserver implements DeliveryObserver {

    private final AuditService auditService;

    public DeliveryAuditObserver(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    public void update(DeliveryLifecycleEvent event) {
        AfterCommit.run(() -> auditService.log(
                event.actor().id(),
                event.actor().email(),
                event.actor().role(),
                "DELIVERY_" + event.type().name(),
                "Delivery",
                String.valueOf(event.deliveryId()),
                event.previousStatus() != null ? event.previousStatus().name() : null,
                event.newStatus().name() + (event.message() != null ? " | " + event.message() : ""),
                null));
    }
}
