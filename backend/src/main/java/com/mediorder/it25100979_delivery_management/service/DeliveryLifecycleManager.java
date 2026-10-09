package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent.Actor;
import com.mediorder.it25100979_delivery_management.exception.DeliveryNotFoundException;
import com.mediorder.it25100979_delivery_management.exception.InvalidDeliveryStateException;
import com.mediorder.it25100979_delivery_management.designe_patter.observer.DeliverySubject;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.security.CurrentUserProvider;
import org.springframework.stereotype.Component;

/**
 * The single place where a delivery's status changes. It
 * 1) enforces the state machine in {@link DeliveryStatus},
 * 2) saves the delivery, and
 * 3) notifies the {@link DeliverySubject}, which fans the event out to all observers.
 */
@Component
public class DeliveryLifecycleManager {

    private final DeliveryRepository deliveryRepository;
    private final DeliverySubject deliveryEvents;
    private final CurrentUserProvider currentUserProvider;

    public DeliveryLifecycleManager(DeliveryRepository deliveryRepository,
                                    DeliverySubject deliveryEvents,
                                    CurrentUserProvider currentUserProvider) {
        this.deliveryRepository = deliveryRepository;
        this.deliveryEvents = deliveryEvents;
        this.currentUserProvider = currentUserProvider;
    }

    public Delivery load(Long id) {
        return deliveryRepository.findById(id).orElseThrow(() -> new DeliveryNotFoundException(id));
    }

    /** Validates the move, saves it and publishes the event. */
    public Delivery transition(Delivery delivery, DeliveryStatus target, DeliveryEventType eventType, String message) {
        DeliveryStatus current = delivery.getStatusEnum();
        if (!current.canTransitionTo(target)) {
            throw InvalidDeliveryStateException.transition(delivery.getId(), current, target);
        }
        delivery.setStatusEnum(target);
        Delivery saved = deliveryRepository.save(delivery);
        deliveryEvents.notifyObservers(DeliveryLifecycleEvent.of(eventType, saved, current, currentActor(), message));
        return saved;
    }

    /** Saves a brand-new delivery and announces it. */
    public Delivery create(Delivery delivery, DeliveryEventType eventType, String message) {
        Delivery saved = deliveryRepository.save(delivery);
        deliveryEvents.notifyObservers(DeliveryLifecycleEvent.of(eventType, saved, null, currentActor(), message));
        return saved;
    }

    /** Saves a change that does not move the status (e.g. a failed OTP attempt) and announces it. */
    public Delivery record(Delivery delivery, DeliveryEventType eventType, String message) {
        DeliveryStatus current = delivery.getStatusEnum();
        Delivery saved = deliveryRepository.save(delivery);
        deliveryEvents.notifyObservers(DeliveryLifecycleEvent.of(eventType, saved, current, currentActor(), message));
        return saved;
    }

    public Actor currentActor() {
        return currentUserProvider.currentUser()
                .map(DeliveryLifecycleManager::toActor)
                .orElse(Actor.SYSTEM);
    }

    private static Actor toActor(User user) {
        return new Actor(user.getId(), user.getFullName(), user.getEmail(),
                user.getRole() != null ? user.getRole().name() : null);
    }
}
