package com.mediorder.system_build_functions.dto;

import jakarta.validation.constraints.NotBlank;

public class AuditLogCreateRequest {

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Action is required")
    private String action;

    @NotBlank(message = "Entity is required")
    private String entity;

    private String entityId;
    private String beforeState;
    private String afterState;
    private String severity = "INFO";
    private String notes;
    private String actorEmail;
    private String actorRole;

    public AuditLogCreateRequest() {}

    public AuditLogCreateRequest(String department, String action, String entity, String entityId,
                                 String beforeState, String afterState, String severity, String notes,
                                 String actorEmail, String actorRole) {
        this.department = department;
        this.action = action;
        this.entity = entity;
        this.entityId = entityId;
        this.beforeState = beforeState;
        this.afterState = afterState;
        this.severity = severity != null ? severity : "INFO";
        this.notes = notes;
        this.actorEmail = actorEmail;
        this.actorRole = actorRole;
    }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
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
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
}
