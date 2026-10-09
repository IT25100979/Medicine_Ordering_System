package com.mediorder.it25100979_delivery_management.observer.impl;

import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import com.mediorder.it25100979_delivery_management.observer.AfterCommit;
import com.mediorder.it25100979_delivery_management.observer.DeliveryObserver;
import com.mediorder.system_build_functions.service.RealtimeService;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Pushes delivery changes to open browser tabs over Server-Sent Events:
 * <ul>
 *   <li>{@value #STAFF_CHANNEL} - the Delivery Management page (new requests appear instantly)</li>
 *   <li>{@code delivery-customer-{userId}} - the customer's "My Deliveries" tracking page</li>
 * </ul>
 * The payload carries no personal data; pages re-fetch details through the secured REST API.
 */
@Component
@Order(4)
public class DeliveryRealtimeObserver implements DeliveryObserver {

    public static final String STAFF_CHANNEL = "deliveries";
    public static final String CUSTOMER_CHANNEL_PREFIX = "delivery-customer-";

    private final RealtimeService realtimeService;

    public DeliveryRealtimeObserver(RealtimeService realtimeService) {
        this.realtimeService = realtimeService;
    }

    @Override
    public void update(DeliveryLifecycleEvent event) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", event.type().name());
        payload.put("deliveryId", event.deliveryId());
        payload.put("previousStatus", event.previousStatus() != null ? event.previousStatus().name() : null);
        payload.put("status", event.newStatus().name());
        payload.put("message", event.message());
        payload.put("occurredAt", event.occurredAt().toString());

        Long customerId = event.delivery().getUserId();
        AfterCommit.run(() -> {
            realtimeService.publish(STAFF_CHANNEL, event.type().name(), payload);
            if (customerId != null) {
                realtimeService.publish(CUSTOMER_CHANNEL_PREFIX + customerId, event.type().name(), payload);
            }
        });
    }
}
