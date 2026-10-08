package com.mediorder.system_build_functions.controller;

import com.mediorder.system_build_functions.dto.ApiResponse;
import com.mediorder.system_build_functions.model.AuditLog;
import com.mediorder.system_build_functions.model.ErrorLog;
import com.mediorder.system_build_functions.model.FeatureFlag;
import com.mediorder.system_build_functions.service.AuditService;
import com.mediorder.system_build_functions.service.ErrorLogService;
import com.mediorder.system_build_functions.service.FeatureFlagService;
import com.mediorder.system_build_functions.service.RealtimeService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.ThreadMXBean;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'ADMIN', 'IT_MANAGER', 'OPERATIONS_MANAGER')")
public class AdminSystemController {

    private final FeatureFlagService featureFlagService;
    private final AuditService auditService;
    private final ErrorLogService errorLogService;
    private final RealtimeService realtimeService;

    public AdminSystemController(FeatureFlagService featureFlagService,
                                 AuditService auditService,
                                 ErrorLogService errorLogService,
                                 RealtimeService realtimeService) {
        this.featureFlagService = featureFlagService;
        this.auditService = auditService;
        this.errorLogService = errorLogService;
        this.realtimeService = realtimeService;
    }

    @GetMapping("/system/metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemMetrics() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();

        long totalMem = Runtime.getRuntime().totalMemory();
        long freeMem = Runtime.getRuntime().freeMemory();
        long maxMem = Runtime.getRuntime().maxMemory();
        long usedMem = totalMem - freeMem;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("status", "HEALTHY");
        metrics.put("uptimeMs", ManagementFactory.getRuntimeMXBean().getUptime());
        metrics.put("totalMemoryBytes", totalMem);
        metrics.put("usedMemoryBytes", usedMem);
        metrics.put("freeMemoryBytes", freeMem);
        metrics.put("maxMemoryBytes", maxMem);
        metrics.put("usedMemoryMB", usedMem / (1024 * 1024));
        metrics.put("freeMemoryMB", freeMem / (1024 * 1024));
        metrics.put("maxMemoryMB", maxMem / (1024 * 1024));
        metrics.put("activeThreads", threadBean.getThreadCount());
        metrics.put("peakThreads", threadBean.getPeakThreadCount());
        metrics.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        metrics.put("heapMemoryUsage", memoryBean.getHeapMemoryUsage());
        metrics.put("databaseStatus", "CONNECTED");
        metrics.put("realtimeSSEStatus", "ACTIVE");

        return ResponseEntity.ok(ApiResponse.success("System metrics retrieved", metrics));
    }

    @GetMapping("/flags")
    public ResponseEntity<ApiResponse<List<FeatureFlag>>> getAllFlags() {
        List<FeatureFlag> flags = featureFlagService.getAllFlags();
        return ResponseEntity.ok(ApiResponse.success("Feature flags retrieved", flags));
    }

    @PutMapping("/flags/{flagKey}")
    public ResponseEntity<ApiResponse<FeatureFlag>> updateFlag(
            @PathVariable String flagKey,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        boolean enabled = body.get("enabled") != null && Boolean.parseBoolean(body.get("enabled").toString());
        String reason = body.get("reason") != null ? body.get("reason").toString() : "Admin manual switch";
        String setBy = authentication != null ? authentication.getName() : "admin";

        FeatureFlag updated = featureFlagService.setFlag(flagKey, enabled, "GLOBAL", null, reason, setBy, null);
        return ResponseEntity.ok(ApiResponse.success("Feature flag updated", updated));
    }

    @GetMapping("/audit")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<AuditLog> logs = auditService.getAuditLogs(page, size);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved", logs));
    }

    @GetMapping("/errors")
    public ResponseEntity<ApiResponse<Page<ErrorLog>>> getErrorLogs(
            @RequestParam(defaultValue = "false") boolean unresolvedOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<ErrorLog> errors = errorLogService.getErrors(unresolvedOnly, page, size);
        return ResponseEntity.ok(ApiResponse.success("Error logs retrieved", errors));
    }

    @PutMapping("/errors/{id}/resolve")
    public ResponseEntity<ApiResponse<ErrorLog>> resolveError(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String notes = body != null ? body.get("notes") : "Resolved by admin";
        String resolvedBy = authentication != null ? authentication.getName() : "admin";
        ErrorLog resolved = errorLogService.resolveError(id, resolvedBy, notes);
        return ResponseEntity.ok(ApiResponse.success("Error resolved", resolved));
    }

    @PostMapping("/system/sse-ping")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ssePing(Authentication authentication) {
        String sender = authentication != null ? authentication.getName() : "admin";
        Map<String, Object> payload = Map.of(
                "event", "SYSTEM_ALERT_PING",
                "sender", sender,
                "message", "Admin diagnostic SSE ping",
                "timestamp", System.currentTimeMillis()
        );
        realtimeService.publish("admin:alerts", "ALERT_PING", payload);
        return ResponseEntity.ok(ApiResponse.success("SSE ping broadcasted to admin:alerts", payload));
    }
}
