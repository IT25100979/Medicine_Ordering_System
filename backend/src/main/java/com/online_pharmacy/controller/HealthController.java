package com.online_pharmacy.controller;

import com.online_pharmacy.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1", "/api"})
@CrossOrigin(origins = "*")
public class HealthController {

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
