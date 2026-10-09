package com.mediorder.it25100979_delivery_management.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_events", indexes = {
    @Index(name = "idx_event_delivery", columnList = "delivery_id")
})
public class DeliveryEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "delivery_id", nullable = false)
    private Long deliveryId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // CREATED, APPROVED, REJECTED, DISPATCHED, IN_TRANSIT, OTP_GENERATED, OTP_VERIFIED, DELIVERED, FAILED, RETURNED

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actorName", length = 150)
    private String actorName;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public DeliveryEvent() {}

    public DeliveryEvent(Long id, Long deliveryId, String eventType, String description,
                         Long actorId, String actorName, String actorRole, LocalDateTime createdAt) {
        this.id = id;
        this.deliveryId = deliveryId;
        this.eventType = eventType;
        this.description = description;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorRole = actorRole;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getDeliveryId() { return deliveryId; }
    public void setDeliveryId(Long deliveryId) { this.deliveryId = deliveryId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static DeliveryEventBuilder builder() {
        return new DeliveryEventBuilder();
    }

    public static class DeliveryEventBuilder {
        private Long id;
        private Long deliveryId;
        private String eventType;
        private String description;
        private Long actorId;
        private String actorName;
        private String actorRole;
        private LocalDateTime createdAt;

        public DeliveryEventBuilder id(Long id) { this.id = id; return this; }
        public DeliveryEventBuilder deliveryId(Long deliveryId) { this.deliveryId = deliveryId; return this; }
        public DeliveryEventBuilder eventType(String eventType) { this.eventType = eventType; return this; }
        public DeliveryEventBuilder description(String description) { this.description = description; return this; }
        public DeliveryEventBuilder actorId(Long actorId) { this.actorId = actorId; return this; }
        public DeliveryEventBuilder actorName(String actorName) { this.actorName = actorName; return this; }
        public DeliveryEventBuilder actorRole(String actorRole) { this.actorRole = actorRole; return this; }
        public DeliveryEventBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public DeliveryEvent build() {
            return new DeliveryEvent(id, deliveryId, eventType, description, actorId, actorName, actorRole, createdAt);
        }
    }
}
