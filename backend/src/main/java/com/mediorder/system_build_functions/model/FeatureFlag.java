package com.mediorder.system_build_functions.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feature_flags", indexes = {
    @Index(name = "idx_flag_key", columnList = "flag_key", unique = true)
})
public class FeatureFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flag_key", nullable = false, unique = true, length = 100)
    private String flagKey; // ORDERING, STOCK_INTAKE, DELIVERY, PRESCRIPTIONS, REFILLS, MEDICINE_<ID>

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(length = 50)
    private String scope = "GLOBAL"; // GLOBAL, PRODUCT

    @Column(name = "target_id", length = 100)
    private String targetId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "set_by", length = 150)
    private String setBy;

    @Column(name = "set_at")
    private LocalDateTime setAt;

    @Column(name = "resume_at")
    private LocalDateTime resumeAt;

    public FeatureFlag() {}

    public FeatureFlag(Long id, String flagKey, Boolean enabled, String scope, String targetId,
                       String reason, String setBy, LocalDateTime setAt, LocalDateTime resumeAt) {
        this.id = id;
        this.flagKey = flagKey;
        this.enabled = enabled != null ? enabled : true;
        this.scope = scope != null ? scope : "GLOBAL";
        this.targetId = targetId;
        this.reason = reason;
        this.setBy = setBy;
        this.setAt = setAt;
        this.resumeAt = resumeAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.setAt == null) {
            this.setAt = LocalDateTime.now();
        }
        if (this.enabled == null) {
            this.enabled = true;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFlagKey() { return flagKey; }
    public void setFlagKey(String flagKey) { this.flagKey = flagKey; }
    public Boolean getEnabled() { return enabled != null ? enabled : true; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }
    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getSetBy() { return setBy; }
    public void setSetBy(String setBy) { this.setBy = setBy; }
    public LocalDateTime getSetAt() { return setAt; }
    public void setSetAt(LocalDateTime setAt) { this.setAt = setAt; }
    public LocalDateTime getResumeAt() { return resumeAt; }
    public void setResumeAt(LocalDateTime resumeAt) { this.resumeAt = resumeAt; }

    public static FeatureFlagBuilder builder() {
        return new FeatureFlagBuilder();
    }

    public static class FeatureFlagBuilder {
        private Long id;
        private String flagKey;
        private Boolean enabled = true;
        private String scope = "GLOBAL";
        private String targetId;
        private String reason;
        private String setBy;
        private LocalDateTime setAt;
        private LocalDateTime resumeAt;

        public FeatureFlagBuilder id(Long id) { this.id = id; return this; }
        public FeatureFlagBuilder flagKey(String flagKey) { this.flagKey = flagKey; return this; }
        public FeatureFlagBuilder enabled(Boolean enabled) { this.enabled = enabled; return this; }
        public FeatureFlagBuilder scope(String scope) { this.scope = scope; return this; }
        public FeatureFlagBuilder targetId(String targetId) { this.targetId = targetId; return this; }
        public FeatureFlagBuilder reason(String reason) { this.reason = reason; return this; }
        public FeatureFlagBuilder setBy(String setBy) { this.setBy = setBy; return this; }
        public FeatureFlagBuilder setAt(LocalDateTime setAt) { this.setAt = setAt; return this; }
        public FeatureFlagBuilder resumeAt(LocalDateTime resumeAt) { this.resumeAt = resumeAt; return this; }

        public FeatureFlag build() {
            return new FeatureFlag(id, flagKey, enabled, scope, targetId, reason, setBy, setAt, resumeAt);
        }
    }
}
