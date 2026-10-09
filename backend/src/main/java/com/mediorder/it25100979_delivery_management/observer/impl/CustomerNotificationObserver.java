package com.mediorder.it25100979_delivery_management.observer.impl;

import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import com.mediorder.it25100979_delivery_management.observer.AfterCommit;
import com.mediorder.it25100979_delivery_management.observer.DeliveryObserver;
import com.mediorder.system_build_functions.model.Notification;
import com.mediorder.system_build_functions.model.NotificationChannel;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.repository.NotificationRepository;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;

/**
 * Creates in-app notifications:
 * delivery coordinators hear about new requests, customers hear about progress on their delivery.
 */
@Component
@Order(5)
public class CustomerNotificationObserver implements DeliveryObserver {

    private static final Set<DeliveryEventType> CUSTOMER_EVENTS = EnumSet.of(
            DeliveryEventType.DELIVERY_APPROVED,
            DeliveryEventType.DELIVERY_REJECTED,
            DeliveryEventType.COURIER_ASSIGNED,
            DeliveryEventType.OUT_FOR_DELIVERY,
            DeliveryEventType.DELIVERED,
            DeliveryEventType.DELIVERY_FAILED,
            DeliveryEventType.OTP_REGENERATED,
            DeliveryEventType.TERMINATED);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public CustomerNotificationObserver(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public boolean isInterestedIn(DeliveryEventType type) {
        return type == DeliveryEventType.DELIVERY_REQUESTED || CUSTOMER_EVENTS.contains(type);
    }

    @Override
    public void update(DeliveryLifecycleEvent event) {
        Delivery delivery = event.delivery();
        String reference = "Delivery #DEL-" + delivery.getId();

        if (event.type() == DeliveryEventType.DELIVERY_REQUESTED) {
            String text = reference + " from " + delivery.getCustomerName()
                    + " is waiting for approval (preferred courier: " + delivery.getPreferredCourier() + ").";
            AfterCommit.run(() -> userRepository.findByRole(Role.DELIVERY_COORDINATOR)
                    .forEach(coordinator -> notificationRepository.save(
                            notification(coordinator, "New delivery request", text))));
            return;
        }

        Long customerId = delivery.getUserId();
        if (customerId == null) {
            return;
        }
        String title = reference + " - " + event.newStatus().getLabel();
        String text = event.message() != null ? event.message() : title;
        AfterCommit.run(() -> userRepository.findById(customerId)
                .ifPresent(customer -> notificationRepository.save(notification(customer, title, text))));
    }

    private Notification notification(com.mediorder.system_build_functions.model.User recipient, String title, String message) {
        return new Notification(null, recipient, title, message, NotificationChannel.IN_APP, false, LocalDateTime.now());
    }
}
