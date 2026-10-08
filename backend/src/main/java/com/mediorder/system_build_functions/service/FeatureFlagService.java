package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.model.FeatureFlag;
import com.mediorder.system_build_functions.repository.FeatureFlagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;
    private final AuditService auditService;

    public FeatureFlagService(FeatureFlagRepository featureFlagRepository, AuditService auditService) {
        this.featureFlagRepository = featureFlagRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public boolean isFeatureEnabled(String flagKey) {
        return featureFlagRepository.findByFlagKey(flagKey)
                .map(flag -> {
                    if (Boolean.FALSE.equals(flag.getEnabled())) {
                        if (flag.getResumeAt() != null && LocalDateTime.now().isAfter(flag.getResumeAt())) {
                            return true; // Auto-resumed
                        }
                        return false;
                    }
                    return true;
                })
                .orElse(true); // Enabled by default if flag not defined
    }

    public void assertFeatureEnabled(String flagKey, String featureName) {
        if (!isFeatureEnabled(flagKey)) {
            FeatureFlag flag = featureFlagRepository.findByFlagKey(flagKey).orElse(null);
            String reason = (flag != null && flag.getReason() != null) ? flag.getReason() : "Workflow temporarily paused for system maintenance.";
            throw new IllegalStateException("Service Unavailable: " + featureName + " is currently disabled. Reason: " + reason);
        }
    }

    @Transactional
    public FeatureFlag setFlag(String flagKey, boolean enabled, String scope, String targetId,
                               String reason, String setBy, LocalDateTime resumeAt) {
        FeatureFlag flag = featureFlagRepository.findByFlagKey(flagKey)
                .orElseGet(() -> FeatureFlag.builder().flagKey(flagKey).build());

        String before = String.format("enabled=%s, reason=%s", flag.getEnabled(), flag.getReason());
        flag.setEnabled(enabled);
        flag.setScope(scope != null ? scope : "GLOBAL");
        flag.setTargetId(targetId);
        flag.setReason(reason);
        flag.setSetBy(setBy);
        flag.setSetAt(LocalDateTime.now());
        flag.setResumeAt(resumeAt);

        FeatureFlag saved = featureFlagRepository.save(flag);
        String after = String.format("enabled=%s, reason=%s, resumeAt=%s", saved.getEnabled(), saved.getReason(), saved.getResumeAt());

        auditService.log(null, setBy, "ADMIN", "TOGGLE_KILL_SWITCH", "FeatureFlag", flagKey, before, after, null);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<FeatureFlag> getAllFlags() {
        return featureFlagRepository.findAll();
    }
}
