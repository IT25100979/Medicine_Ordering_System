package com.mediorder.it25101923_prescription_management.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity tracking order usage of approved prescriptions.
 * IT25101923
 */
@Entity
@Table(name = "prescription_usage", uniqueConstraints = @UniqueConstraint(columnNames = {"prescription_id", "order_id"}))
public class PrescriptionUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prescription_id", nullable = false)
    private Long prescriptionId;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    public PrescriptionUsage() {}

    public PrescriptionUsage(Long rx, Long order, Long actor) {
        LocalDateTime now = LocalDateTime.now();
        this.prescriptionId = rx;
        this.orderId = order;
        this.actorId = actor;
        this.createdAt = now;
        this.usedAt = now;
    }

    public Long getId() { return id; }
    public Long getPrescriptionId() { return prescriptionId; }
    public Long getOrderId() { return orderId; }
    public Long getActorId() { return actorId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUsedAt() { return usedAt; }
}
