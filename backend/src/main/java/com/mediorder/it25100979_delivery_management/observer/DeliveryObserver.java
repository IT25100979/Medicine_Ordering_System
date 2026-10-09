package com.mediorder.it25100979_delivery_management.observer;

import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;

/**
 * OBSERVER in the Observer design pattern.
 *
 * Anything that needs to react to a delivery changing (timeline, audit log, live dashboard,
 * customer notifications, order status sync...) implements this interface. The delivery
 * services never call those reactions directly - they only notify the {@link DeliverySubject}.
 * Adding a new reaction therefore means adding a new observer class, with no change to the
 * delivery workflow code (Open/Closed principle).
 */
public interface DeliveryObserver {

    /** Called by the subject every time a delivery event this observer is interested in occurs. */
    void update(DeliveryLifecycleEvent event);

    /** Filter: return false to ignore event types this observer does not handle. */
    default boolean isInterestedIn(DeliveryEventType type) {
        return true;
    }

    /**
     * Critical observers run inside the caller's transaction and a failure aborts the change
     * (e.g. the timeline and order status must stay consistent with the delivery).
     * Non-critical observers (notifications, live updates) are best-effort: their failures are logged only.
     */
    default boolean isCritical() {
        return false;
    }
}
