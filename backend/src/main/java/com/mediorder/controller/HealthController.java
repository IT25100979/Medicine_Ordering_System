package com.mediorder.controller;

import com.mediorder.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "System Health", description = "Backbone health check and token authentication test endpoint")
public class HealthController {

    @GetMapping
    @Operation(summary = "System health check and role extraction")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck(Authentication authentication) {
        Map<String, Object> data = new HashMap<>();
        data.put("status", "UP");
        data.put("service", "MediOrder Order & Inventory Engine");
        data.put("version", "v1.0.0");

        if (authentication != null && authentication.isAuthenticated()) {
            data.put("authenticated", true);
            data.put("principal", authentication.getName());
            data.put("authorities", authentication.getAuthorities());
        } else {
            data.put("authenticated", false);
            data.put("mode", "dev-permissive");
        }

        return ResponseEntity.ok(ApiResponse.ok(data, "MediOrder API is healthy"));
    }
}
