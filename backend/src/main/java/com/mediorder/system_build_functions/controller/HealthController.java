package com.mediorder.system_build_functions.controller;

import com.mediorder.system_build_functions.dto.ApiResponse;
import com.mediorder.system_build_functions.repository.FeatureFlagRepository;
import com.mediorder.system_build_functions.service.FeatureFlagService;
import com.mediorder.system_build_functions.service.FeatureKeys;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1", "/api"})
@CrossOrigin(origins = "*")
public class HealthController {

    private final FeatureFlagService featureFlagService;
    private final FeatureFlagRepository featureFlagRepository;

    public HealthController(FeatureFlagService featureFlagService, FeatureFlagRepository featureFlagRepository) {
        this.featureFlagService = featureFlagService;
        this.featureFlagRepository = featureFlagRepository;
    }

    /**
     * Public: which workflows the System Admin has paused, so pages can show
     * "temporarily unavailable" instead of failing on submit.
     */
    @GetMapping("/health/features")
    public ResponseEntity<ApiResponse<Map<String, Object>>> featureStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        for (String key : List.of(FeatureKeys.ORDERING, FeatureKeys.DELIVERY, FeatureKeys.PRESCRIPTIONS,
                FeatureKeys.REFILLS, FeatureKeys.STOCK_INTAKE)) {
            boolean enabled = featureFlagService.isFeatureEnabled(key);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("enabled", enabled);
            if (!enabled) {
                featureFlagRepository.findByFlagKey(key).ifPresent(flag -> {
                    entry.put("reason", flag.getReason());
                    entry.put("resumeAt", flag.getResumeAt());
                });
            }
            status.put(key, entry);
        }
        return ResponseEntity.ok(ApiResponse.success("Feature status", status));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> healthInfo = Map.of(
                "status", "UP",
                "service", "online_pharmacy-backend",
                "timestamp", LocalDateTime.now()
        );
        return ResponseEntity.ok(ApiResponse.success("Service is healthy", healthInfo));
    }
}


