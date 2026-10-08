package com.mediorder.system_build_functions.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_actor", columnList = "actor_id"),
    @Index(name = "idx_audit_department", columnList = "department"),
    @Index(name = "idx_audit_entity", columnList = "entity, entity_id"),
    @Index(name = "idx_audit_created_at", columnList = "created_at")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_email", length = 150)
    private String actorEmail;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "entity", nullable = false, length = 100)
    private String entity;

    @Column(name = "entity_id", length = 100)
    private String entityId;

    @Column(name = "before_state", columnDefinition = "TEXT")
    private String beforeState;

    @Column(name = "after_state", columnDefinition = "TEXT")
    private String afterState;

    @Column(name = "severity", length = 30)
    private String severity = "INFO";

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AuditLog() {}

    public AuditLog(Long id, String department, Long actorId, String actorEmail, String actorRole, String action,
                    String entity, String entityId, String beforeState, String afterState,
                    String severity, String ipAddress, LocalDateTime createdAt) {
        this.id = id;
        this.department = department;
        this.actorId = actorId;
        this.actorEmail = actorEmail;
        this.actorRole = actorRole;
        this.action = action;
        this.entity = entity;
        this.entityId = entityId;
        this.beforeState = beforeState;
        this.afterState = afterState;
        this.severity = severity != null ? severity : "INFO";
        this.ipAddress = ipAddress;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.severity == null) {
            this.severity = "INFO";
        }
        if (this.department == null && this.entity != null) {
            this.department = inferDepartment(this.entity);
        }
    }

    private String inferDepartment(String entityName) {
        if (entityName == null) return "SYSTEM_ADMIN";
        String e = entityName.toUpperCase();
        if (e.contains("DELIVERY") || e.contains("COURIER") || e.contains("ZONE")) return "DELIVERY_MANAGEMENT";
        if (e.contains("MEDICINE") || e.contains("BATCH") || e.contains("STOCK") || e.contains("CATALOG")) return "CATALOG_MANAGEMENT";
        if (e.contains("PRESCRIPTION")) return "PRESCRIPTION_MANAGEMENT";
        if (e.contains("COLD_CHAIN") || e.contains("TELEMETRY")) return "COLD_CHAIN_MANAGEMENT";
        if (e.contains("SUBSCRIPTION") || e.contains("REFILL")) return "SUBSCRIPTION_MANAGEMENT";
        if (e.contains("USER") || e.contains("AUTH") || e.contains("ROLE")) return "USER_SECURITY";
        if (e.contains("ORDER") || e.contains("CART") || e.contains("PAYMENT") || e.contains("INVOICE")) return "FINANCE_MANAGEMENT";
        return "SYSTEM_ADMIN";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }
    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }
    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public String getBeforeState() { return beforeState; }
    public void setBeforeState(String beforeState) { this.beforeState = beforeState; }
    public String getAfterState() { return afterState; }
    public void setAfterState(String afterState) { this.afterState = afterState; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static AuditLogBuilder builder() {
        return new AuditLogBuilder();
    }

    public static class AuditLogBuilder {
        private Long id;
        private String department;
        private Long actorId;
        private String actorEmail;
        private String actorRole;
        private String action;
        private String entity;
        private String entityId;
        private String beforeState;
        private String afterState;
        private String severity = "INFO";
        private String ipAddress;
        private LocalDateTime createdAt;

        public AuditLogBuilder id(Long id) { this.id = id; return this; }
        public AuditLogBuilder department(String department) { this.department = department; return this; }
        public AuditLogBuilder actorId(Long actorId) { this.actorId = actorId; return this; }
        public AuditLogBuilder actorEmail(String actorEmail) { this.actorEmail = actorEmail; return this; }
        public AuditLogBuilder actorRole(String actorRole) { this.actorRole = actorRole; return this; }
        public AuditLogBuilder action(String action) { this.action = action; return this; }
        public AuditLogBuilder entity(String entity) { this.entity = entity; return this; }
        public AuditLogBuilder entityId(String entityId) { this.entityId = entityId; return this; }
        public AuditLogBuilder beforeState(String beforeState) { this.beforeState = beforeState; return this; }
        public AuditLogBuilder afterState(String afterState) { this.afterState = afterState; return this; }
        public AuditLogBuilder severity(String severity) { this.severity = severity; return this; }
        public AuditLogBuilder ipAddress(String ipAddress) { this.ipAddress = ipAddress; return this; }
        public AuditLogBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public AuditLog build() {
            return new AuditLog(id, department, actorId, actorEmail, actorRole, action, entity, entityId, beforeState, afterState, severity, ipAddress, createdAt);
        }
    }
}
