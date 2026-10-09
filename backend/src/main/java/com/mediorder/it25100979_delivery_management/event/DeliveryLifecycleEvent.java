package com.mediorder.it25100979_delivery_management.event;

import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;

import java.time.LocalDateTime;

/**
 * Immutable message passed from the subject ({@code DeliveryEventPublisher}) to every observer.
 *
 * @param type           what happened
 * @param delivery       the delivery after the change (already saved)
 * @param previousStatus status before the change, null when the delivery was just created
 * @param newStatus      status after the change
 * @param actor          who caused it (customer, coordinator, courier or system)
 * @param message        human readable description, used for the timeline/notifications
 * @param occurredAt     when it happened
 */
public record DeliveryLifecycleEvent(
        DeliveryEventType type,
        Delivery delivery,
        DeliveryStatus previousStatus,
        DeliveryStatus newStatus,
        Actor actor,
        String message,
        LocalDateTime occurredAt) {

    public static DeliveryLifecycleEvent of(DeliveryEventType type, Delivery delivery,
                                            DeliveryStatus previousStatus, Actor actor, String message) {
        return new DeliveryLifecycleEvent(type, delivery, previousStatus, delivery.getStatusEnum(),
                actor != null ? actor : Actor.SYSTEM, message, LocalDateTime.now());
    }

    public Long deliveryId() {
        return delivery.getId();
    }

    public boolean statusChanged() {
        return previousStatus != newStatus;
    }

    /** The user that triggered the event. */
    public record Actor(Long id, String name, String email, String role) {
        public static final Actor SYSTEM = new Actor(null, "System", "system@mediorder.com", "SYSTEM");
    }
}
