package com.mediorder.it25100979_delivery_management.observer;

import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * CONCRETE SUBJECT. Every {@link DeliveryObserver} bean in the application is attached
 * automatically at start-up; observers can also be attached/detached at runtime.
 */
@Component
public class DeliveryEventPublisher implements DeliverySubject {

    private static final Logger log = LoggerFactory.getLogger(DeliveryEventPublisher.class);

    private final List<DeliveryObserver> observers = new CopyOnWriteArrayList<>();

    public DeliveryEventPublisher(List<DeliveryObserver> initialObservers) {
        initialObservers.forEach(this::attach);
    }

    @Override
    public void attach(DeliveryObserver observer) {
        if (observer != null && !observers.contains(observer)) {
            observers.add(observer);
            log.debug("Delivery observer attached: {}", observer.getClass().getSimpleName());
        }
    }

    @Override
    public void detach(DeliveryObserver observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyObservers(DeliveryLifecycleEvent event) {
        log.info("Delivery event {} for delivery #{} ({} -> {})",
                event.type(), event.deliveryId(), event.previousStatus(), event.newStatus());

        for (DeliveryObserver observer : observers) {
            if (!observer.isInterestedIn(event.type())) {
                continue;
            }
            try {
                observer.update(event);
            } catch (RuntimeException ex) {
                if (observer.isCritical()) {
                    throw ex; // rolls back the delivery change together with the observer's work
                }
                log.warn("Non-critical delivery observer {} failed for event {}: {}",
                        observer.getClass().getSimpleName(), event.type(), ex.getMessage());
            }
        }
    }

    public List<DeliveryObserver> getObservers() {
        return Collections.unmodifiableList(observers);
    }
}
