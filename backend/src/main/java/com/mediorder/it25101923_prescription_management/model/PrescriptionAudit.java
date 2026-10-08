package com.mediorder.it25101923_prescription_management.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Audit log entity for prescription status transitions and clinical actions.
 * Maps both created_at and occurred_at column variations for database compatibility.
 * IT25101923
 */
@Entity
@Table(name = "prescription_audit")
public class PrescriptionAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prescription_id", nullable = false, updatable = false)
    private Long prescriptionId;

    @Column(name = "actor_id", nullable = false, updatable = false)
    private Long actorId;

    @Column(name = "actor_name", nullable = false, updatable = false, length = 150)
    private String actorName;

    @Column(name = "action", nullable = false, updatable = false, length = 40)
    private String action;

    @Column(name = "from_status", updatable = false, length = 40)
    private String fromStatus;

    @Column(name = "to_status", updatable = false, length = 40)
    private String toStatus;

    @Column(name = "details", updatable = false, length = 2000)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;

    public PrescriptionAudit() {}

    public PrescriptionAudit(Long rx, Long actor, String name, String action, String from, String to, String details) {
        LocalDateTime now = LocalDateTime.now();
        this.prescriptionId = rx;
        this.actorId = actor;
        this.actorName = name;
        this.action = action;
        this.fromStatus = from;
        this.toStatus = to;
        this.details = details;
        this.createdAt = now;
        this.occurredAt = now;
    }

    public Long getId() { return id; }
    public Long getPrescriptionId() { return prescriptionId; }
    public Long getActorId() { return actorId; }
    public String getActorName() { return actorName; }
    public String getAction() { return action; }
    public String getFromStatus() { return fromStatus; }
    public String getToStatus() { return toStatus; }
    public String getDetails() { return details; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
}
