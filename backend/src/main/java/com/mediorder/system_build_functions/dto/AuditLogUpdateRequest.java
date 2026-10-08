package com.mediorder.system_build_functions.dto;

public class AuditLogUpdateRequest {

    private String department;
    private String action;
    private String entity;
    private String entityId;
    private String beforeState;
    private String afterState;
    private String severity;
    private String notes;

    public AuditLogUpdateRequest() {}

    public AuditLogUpdateRequest(String department, String action, String entity, String entityId,
                                 String beforeState, String afterState, String severity, String notes) {
        this.department = department;
        this.action = action;
        this.entity = entity;
        this.entityId = entityId;
        this.beforeState = beforeState;
        this.afterState = afterState;
        this.severity = severity;
        this.notes = notes;
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
}
