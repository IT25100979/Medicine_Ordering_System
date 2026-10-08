package com.mediorder.it25101923_prescription_management.controller;

import com.mediorder.it25101923_prescription_management.dto.PrescriptionResponse;
import com.mediorder.it25101923_prescription_management.dto.PrescriptionUpdateRequest;
import com.mediorder.it25101923_prescription_management.dto.PrescriptionUsageRequest;
import com.mediorder.it25101923_prescription_management.dto.PrescriptionVerificationRequest;
import com.mediorder.it25101923_prescription_management.model.Prescription;
import com.mediorder.it25101923_prescription_management.model.PrescriptionAudit;
import com.mediorder.it25101923_prescription_management.model.PrescriptionStatus;
import com.mediorder.it25101923_prescription_management.model.PrescriptionUsage;
import com.mediorder.it25101923_prescription_management.model.RejectionCode;
import com.mediorder.it25101923_prescription_management.service.PrescriptionCleanupService;
import com.mediorder.it25101923_prescription_management.service.PrescriptionService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Prescription Management Module
 * IT25101923
 *
 * Provides endpoints for uploading, viewing, updating, verifying, downloading,
 * tracking usage, and auto-cleanup of prescriptions.
 */
@RestController
@RequestMapping({"/api/v1/prescriptions", "/api/prescriptions"})
@CrossOrigin(origins = "*")
public class PrescriptionController {

    @Autowired
    private PrescriptionService prescriptionService;

    @Autowired
    private PrescriptionCleanupService cleanupService;

    /**
     * Upload a new prescription document (PDF, JPG, PNG, WEBP).
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PrescriptionResponse> uploadPrescription(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "doctorName", required = false) String doctorName,
            @RequestParam(value = "patientNotes", required = false) String patientNotes,
            @RequestParam(value = "chronicSubscription", required = false, defaultValue = "false") Boolean chronicSubscription,
            Authentication authentication) {

        PrescriptionResponse response = prescriptionService.uploadPrescription(
                file, doctorName, patientNotes, chronicSubscription, authentication
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get all prescriptions (filtered by status, chronic status, or search query).
     */
    @GetMapping
    public ResponseEntity<List<PrescriptionResponse>> getAllPrescriptions(
            @RequestParam(value = "status", required = false) PrescriptionStatus status,
            @RequestParam(value = "chronicOnly", required = false, defaultValue = "false") Boolean chronicOnly,
            @RequestParam(value = "search", required = false) String search,
            Authentication authentication) {

        return ResponseEntity.ok(prescriptionService.getAllPrescriptions(status, chronicOnly, search, authentication));
    }

    /**
     * Get prescription details by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionResponse> getPrescriptionById(
            @PathVariable Long id,
            Authentication authentication) {

        return ResponseEntity.ok(prescriptionService.getPrescriptionById(id, authentication));
    }

    /**
     * Download or view original prescription document file.
     */
    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> getPrescriptionFile(
            @PathVariable Long id,
            Authentication authentication) {

        Resource resource = prescriptionService.getFileResource(id, authentication);
        Prescription p = prescriptionService.getPrescriptionEntity(id);

        String contentType = p.getContentType();
        if (contentType == null || contentType.trim().isEmpty()) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + (p.getOriginalFileName() != null ? p.getOriginalFileName() : resource.getFilename()) + "\"")
                .body(resource);
    }

    /**
     * View prescription document by stored file name.
     */
    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> getPrescriptionFileByStoredName(
            @PathVariable String fileName,
            Authentication authentication) {

        Resource resource = prescriptionService.getFileResourceByStoredName(fileName, authentication);
        String contentType = "application/octet-stream";
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf")) {
            contentType = "application/pdf";
        } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (lower.endsWith(".png")) {
            contentType = "image/png";
        } else if (lower.endsWith(".webp")) {
            contentType = "image/webp";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }

    /**
     * Clinical Pharmacist endpoint: Verify, reject, or request clarification.
     */
    @PreAuthorize("hasAnyRole('PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN')")
    @PutMapping("/{id}/verify")
    public ResponseEntity<PrescriptionResponse> verifyPrescription(
            @PathVariable Long id,
            @RequestBody PrescriptionVerificationRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(prescriptionService.verifyPrescription(id, request, authentication));
    }

    /**
     * Customer endpoint: Update or resubmit pending/clarification prescription.
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PrescriptionResponse> updatePrescription(
            @PathVariable Long id,
            @RequestParam(required = false) String doctorName,
            @RequestParam(required = false) String patientNotes,
            @RequestParam(defaultValue = "false") Boolean chronicSubscription,
            @RequestParam(required = false) Long version,
            @RequestParam(required = false) MultipartFile file,
            Authentication authentication) {

        PrescriptionUpdateRequest request = new PrescriptionUpdateRequest(doctorName, patientNotes, chronicSubscription, version);
        return ResponseEntity.ok(prescriptionService.updatePrescription(id, request, file, authentication));
    }

    /**
     * Get predefined rejection reason categories.
     */
    @GetMapping("/reason-codes")
    public ResponseEntity<List<Map<String, String>>> getReasonCodes() {
        List<Map<String, String>> codes = Arrays.stream(RejectionCode.values())
                .map(c -> Map.of("code", c.name(), "label", c.getLabel()))
                .toList();
        return ResponseEntity.ok(codes);
    }

    /**
     * Get append-only audit trail for a prescription.
     */
    @GetMapping("/{id}/audit")
    public ResponseEntity<List<PrescriptionAudit>> getAuditLogs(
            @PathVariable Long id,
            Authentication authentication) {

        return ResponseEntity.ok(prescriptionService.getAudit(id, authentication));
    }

    /**
     * Get order fill usages for a prescription.
     */
    @GetMapping("/{id}/usage")
    public ResponseEntity<List<PrescriptionUsage>> getUsages(
            @PathVariable Long id,
            Authentication authentication) {

        return ResponseEntity.ok(prescriptionService.getUsage(id, authentication));
    }

    /**
     * Record order usage for an approved prescription.
     */
    @PreAuthorize("hasAnyRole('PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN')")
    @PostMapping("/{id}/usage")
    public ResponseEntity<PrescriptionResponse> recordUsage(
            @PathVariable Long id,
            @Valid @RequestBody PrescriptionUsageRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(prescriptionService.recordUsage(id, request.orderId(), authentication));
    }

    /**
     * Customer endpoint: Soft-delete prescription record.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrescription(
            @PathVariable Long id,
            Authentication authentication) {

        prescriptionService.deletePrescription(id, authentication);
        return ResponseEntity.noContent().build();
    }

    /**
     * Pharmacist endpoint: Execute retention cleanup policy.
     */
    @PreAuthorize("hasAnyRole('PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN')")
    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> triggerCleanup(Authentication authentication) {
    prescriptionService.requireClinicalStaff(authentication);
    return ResponseEntity.ok(cleanupService.runCleanupManually());
}
}
