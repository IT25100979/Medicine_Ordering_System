package com.mediorder.it25101882_cold_chain_tagging.controller;

import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainTelemetryRequest;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainTag;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainTelemetry;
import com.mediorder.it25101882_cold_chain_tagging.service.ColdChainService;
import com.mediorder.system_build_functions.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/cold-chain", "/api/v1/cold-chain"})
@CrossOrigin(origins = "*")
public class ColdChainController {

    @Autowired
    private ColdChainService coldChainService;

    // --- Telemetry Endpoints ---
    @GetMapping
    public ResponseEntity<List<ColdChainTelemetry>> getAllTelemetry() {
        return ResponseEntity.ok(coldChainService.getAllTelemetry());
    }

    @GetMapping("/delivery/{deliveryId}")
    public ResponseEntity<List<ColdChainTelemetry>> getDeliveryTelemetry(@PathVariable Long deliveryId) {
        return ResponseEntity.ok(coldChainService.getTelemetryByDelivery(deliveryId));
    }

    @GetMapping("/breaches")
    public ResponseEntity<List<ColdChainTelemetry>> getBreachedTelemetry() {
        return ResponseEntity.ok(coldChainService.getBreachedTelemetry());
    }

    @PostMapping("/telemetry")
    public ResponseEntity<ColdChainTelemetry> recordTelemetry(@jakarta.validation.Valid @RequestBody ColdChainTelemetryRequest request) {
        return ResponseEntity.ok(coldChainService.recordTelemetry(request));
    }

    // --- Cold Chain Tagging Endpoints ---
    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<List<ColdChainTag>>> getAllTags() {
        return ResponseEntity.ok(ApiResponse.success("Cold chain tags retrieved", coldChainService.getAllTags()));
    }

    @GetMapping("/tags/medicine/{medicineId}")
    public ResponseEntity<ApiResponse<ColdChainTag>> getTagByMedicineId(@PathVariable Long medicineId) {
        return coldChainService.getTagByMedicineId(medicineId)
                .map(tag -> ResponseEntity.ok(ApiResponse.success("Tag found", tag)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success("No tag found for medicine", null)));
    }

    @PostMapping("/tags/medicine/{medicineId}")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<ColdChainTag>> tagMedicine(
            @PathVariable Long medicineId,
            @RequestBody ColdChainTag tagRequest,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "system@mediorder.com";
        String role = authentication != null && !authentication.getAuthorities().isEmpty()
                ? authentication.getAuthorities().iterator().next().getAuthority()
                : "OPERATIONS_MANAGER";

        ColdChainTag saved = coldChainService.tagMedicine(medicineId, tagRequest, email, role);
        return ResponseEntity.ok(ApiResponse.success("Medicine cold chain tag configured", saved));
    }

    @PostMapping("/tags/{tagId}/review")
    @PreAuthorize("hasAnyRole('CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<ColdChainTag>> reviewTag(
            @PathVariable Long tagId,
            @RequestParam String action,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "pharmacist@mediorder.com";
        String role = authentication != null && !authentication.getAuthorities().isEmpty()
                ? authentication.getAuthorities().iterator().next().getAuthority()
                : "CHIEF_PHARMACIST";

        ColdChainTag reviewed = coldChainService.reviewTag(tagId, action, email, role);
        return ResponseEntity.ok(ApiResponse.success("Cold chain tag reviewed successfully", reviewed));
    }

    @PostMapping("/tags/{tagId}/move-section")
    @PreAuthorize("hasAnyRole('OPERATIONS_MANAGER', 'CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<ColdChainTag>> moveSection(
            @PathVariable Long tagId,
            @RequestParam com.mediorder.it25101882_cold_chain_tagging.model.ColdChainSection section,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "pharmacist@mediorder.com";
        String role = authentication != null && !authentication.getAuthorities().isEmpty()
                ? authentication.getAuthorities().iterator().next().getAuthority()
                : "CHIEF_PHARMACIST";

        ColdChainTag moved = coldChainService.moveShelfSection(tagId, section, email, role);
        return ResponseEntity.ok(ApiResponse.success("Shelf section updated with audit logging", moved));
    }

    @PostMapping("/tags/{tagId}/dual-confirm")
    @PreAuthorize("hasAnyRole('CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<ColdChainTag>> dualConfirmTag(
            @PathVariable Long tagId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String primaryEmail = authentication != null ? authentication.getName() : "pharmacist@mediorder.com";
        String secondReviewer = body != null && body.containsKey("secondReviewer")
                ? body.get("secondReviewer")
                : "Dr. Sarah Pharmacist (Reg #SLMC-8492)";
        String notes = body != null && body.containsKey("notes")
                ? body.get("notes")
                : "Dual confirmation authorized under high security & critical cold-chain protocol";

        ColdChainTag confirmed = coldChainService.dualConfirmTag(tagId, secondReviewer, notes, primaryEmail);
        return ResponseEntity.ok(ApiResponse.success("Dual confirmation recorded successfully", confirmed));
    }

    @GetMapping("/sections")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCanonicalSections() {
        return ResponseEntity.ok(ApiResponse.success("Canonical 5 cold chain sections retrieved", coldChainService.getCanonicalSectionMetadata()));
    }
}
