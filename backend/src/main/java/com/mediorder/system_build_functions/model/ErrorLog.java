package com.mediorder.system_build_functions.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "error_logs", indexes = {
    @Index(name = "idx_error_severity", columnList = "severity"),
    @Index(name = "idx_error_created_at", columnList = "created_at"),
    @Index(name = "idx_error_resolved", columnList = "resolved")
})
public class ErrorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String source = "BACKEND"; // FRONTEND, BACKEND

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "stack_trace", columnDefinition = "LONGTEXT")
    private String stackTrace;

    @Column(length = 255)
    private String route;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_email", length = 150)
    private String userEmail;

    @Column(length = 20)
    private String severity = "ERROR"; // INFO, WARN, ERROR, FATAL

    @Column(nullable = false)
    private Boolean resolved = false;

    @Column(name = "resolved_by", length = 150)
    private String resolvedBy;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public ErrorLog() {}

    public ErrorLog(Long id, String source, String message, String stackTrace, String route,
                    Long userId, String userEmail, String severity, Boolean resolved,
                    String resolvedBy, String resolutionNotes, LocalDateTime createdAt) {
        this.id = id;
        this.source = source != null ? source : "BACKEND";
        this.message = message;
        this.stackTrace = stackTrace;
        this.route = route;
        this.userId = userId;
        this.userEmail = userEmail;
        this.severity = severity != null ? severity : "ERROR";
        this.resolved = resolved != null ? resolved : false;
        this.resolvedBy = resolvedBy;
        this.resolutionNotes = resolutionNotes;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.source == null) {
            this.source = "BACKEND";
        }
        if (this.severity == null) {
            this.severity = "ERROR";
        }
        if (this.resolved == null) {
            this.resolved = false;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getStackTrace() { return stackTrace; }
    public void setStackTrace(String stackTrace) { this.stackTrace = stackTrace; }
    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public Boolean getResolved() { return resolved; }
    public void setResolved(Boolean resolved) { this.resolved = resolved; }
    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }
    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static ErrorLogBuilder builder() {
        return new ErrorLogBuilder();
    }

    public static class ErrorLogBuilder {
        private Long id;
        private String source = "BACKEND";
        private String message;
        private String stackTrace;
        private String route;
        private Long userId;
        private String userEmail;
        private String severity = "ERROR";
        private Boolean resolved = false;
        private String resolvedBy;
        private String resolutionNotes;
        private LocalDateTime createdAt;

        public ErrorLogBuilder id(Long id) { this.id = id; return this; }
        public ErrorLogBuilder source(String source) { this.source = source; return this; }
        public ErrorLogBuilder message(String message) { this.message = message; return this; }
        public ErrorLogBuilder stackTrace(String stackTrace) { this.stackTrace = stackTrace; return this; }
        public ErrorLogBuilder route(String route) { this.route = route; return this; }
        public ErrorLogBuilder userId(Long userId) { this.userId = userId; return this; }
        public ErrorLogBuilder userEmail(String userEmail) { this.userEmail = userEmail; return this; }
        public ErrorLogBuilder severity(String severity) { this.severity = severity; return this; }
        public ErrorLogBuilder resolved(Boolean resolved) { this.resolved = resolved; return this; }
        public ErrorLogBuilder resolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; return this; }
        public ErrorLogBuilder resolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; return this; }
        public ErrorLogBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public ErrorLog build() {
            return new ErrorLog(id, source, message, stackTrace, route, userId, userEmail, severity, resolved, resolvedBy, resolutionNotes, createdAt);
        }
    }
}
