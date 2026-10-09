package com.mediorder.it25100979_delivery_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One row in a delivery's history (requested, approved, courier assigned, delivered...).
 * Written by {@code DeliveryTimelineObserver} whenever a delivery event is published.
 */
@Entity
@Table(name = "delivery_events", indexes = {
        @Index(name = "idx_event_delivery", columnList = "delivery_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryTimelineEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "delivery_id", nullable = false)
    private Long deliveryId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "from_status", length = 30)
    private String fromStatus;

    @Column(name = "to_status", length = 30)
    private String toStatus;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_name", length = 150)
    private String actorName;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
