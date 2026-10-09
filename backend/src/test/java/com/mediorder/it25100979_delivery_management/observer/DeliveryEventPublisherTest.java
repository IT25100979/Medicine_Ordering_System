package com.mediorder.it25100979_delivery_management.observer;

import com.mediorder.it25100979_delivery_management.RecordingObserver;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Verifies the Subject side of the Observer pattern. */
class DeliveryEventPublisherTest {

    private static DeliveryLifecycleEvent event(DeliveryEventType type) {
        Delivery d = Delivery.builder().id(7L).status(DeliveryStatus.APPROVED.name()).build();
        return DeliveryLifecycleEvent.of(type, d, DeliveryStatus.PENDING, null, "test");
    }

    @Test
    void notifiesEveryAttachedObserver() {
        RecordingObserver a = new RecordingObserver();
        RecordingObserver b = new RecordingObserver();
        DeliveryEventPublisher subject = new DeliveryEventPublisher(List.of(a, b));

        subject.notifyObservers(event(DeliveryEventType.DELIVERY_APPROVED));

        assertEquals(1, a.events.size());
        assertEquals(1, b.events.size());
        assertEquals(DeliveryLifecycleEvent.Actor.SYSTEM, a.last().actor(), "missing actor falls back to SYSTEM");
    }

    @Test
    void detachedObserversStopReceivingEvents() {
        RecordingObserver a = new RecordingObserver();
        DeliveryEventPublisher subject = new DeliveryEventPublisher(List.of());
        subject.attach(a);
        subject.attach(a); // attaching twice has no effect
        subject.notifyObservers(event(DeliveryEventType.DELIVERY_APPROVED));
        subject.detach(a);
        subject.notifyObservers(event(DeliveryEventType.DELIVERY_APPROVED));

        assertEquals(1, a.events.size());
    }

    @Test
    void observersOnlyReceiveEventTypesTheyAreInterestedIn() {
        RecordingObserver onlyDelivered = new RecordingObserver() {
            @Override
            public boolean isInterestedIn(DeliveryEventType type) {
                return type == DeliveryEventType.DELIVERED;
            }
        };
        DeliveryEventPublisher subject = new DeliveryEventPublisher(List.of(onlyDelivered));

        subject.notifyObservers(event(DeliveryEventType.DELIVERY_APPROVED));
        subject.notifyObservers(event(DeliveryEventType.DELIVERED));

        assertEquals(List.of(DeliveryEventType.DELIVERED), onlyDelivered.types());
    }

    @Test
    void failingNonCriticalObserverDoesNotStopOthers() {
        DeliveryObserver broken = e -> { throw new IllegalStateException("SSE down"); };
        RecordingObserver after = new RecordingObserver();
        DeliveryEventPublisher subject = new DeliveryEventPublisher(List.of(broken, after));

        assertDoesNotThrow(() -> subject.notifyObservers(event(DeliveryEventType.DELIVERY_APPROVED)));
        assertEquals(1, after.events.size());
    }

    @Test
    void failingCriticalObserverAbortsTheChange() {
        DeliveryObserver critical = new DeliveryObserver() {
            @Override
            public void update(DeliveryLifecycleEvent e) {
                throw new IllegalStateException("timeline write failed");
            }

            @Override
            public boolean isCritical() {
                return true;
            }
        };
        DeliveryEventPublisher subject = new DeliveryEventPublisher(List.of(critical));

        assertThrows(IllegalStateException.class, () -> subject.notifyObservers(event(DeliveryEventType.DELIVERY_APPROVED)));
    }
}
