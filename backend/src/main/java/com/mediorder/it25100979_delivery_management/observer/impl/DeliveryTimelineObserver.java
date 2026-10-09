package com.mediorder.it25100979_delivery_management.observer.impl;

import com.mediorder.it25100979_delivery_management.entity.DeliveryTimelineEntry;
import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import com.mediorder.it25100979_delivery_management.observer.DeliveryObserver;
import com.mediorder.it25100979_delivery_management.repository.DeliveryTimelineRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Records every delivery event as a row in the delivery's tracking timeline. */
@Component
@Order(1)
public class DeliveryTimelineObserver implements DeliveryObserver {

    private final DeliveryTimelineRepository timelineRepository;

    public DeliveryTimelineObserver(DeliveryTimelineRepository timelineRepository) {
        this.timelineRepository = timelineRepository;
    }

    @Override
    public void update(DeliveryLifecycleEvent event) {
        timelineRepository.save(DeliveryTimelineEntry.builder()
                .deliveryId(event.deliveryId())
                .eventType(event.type().name())
                .fromStatus(event.previousStatus() != null ? event.previousStatus().name() : null)
                .toStatus(event.newStatus().name())
                .description(event.message())
                .actorId(event.actor().id())
                .actorName(event.actor().name())
                .actorRole(event.actor().role())
                .createdAt(event.occurredAt())
                .build());
    }

    @Override
    public boolean isCritical() {
        return true;
    }
}
