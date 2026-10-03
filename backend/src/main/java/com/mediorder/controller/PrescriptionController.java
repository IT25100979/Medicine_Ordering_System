package com.mediorder.controller;

import com.mediorder.dto.PrescriptionResponse;
import com.mediorder.dto.PrescriptionVerificationRequest;
import com.mediorder.model.Prescription;
import com.mediorder.model.PrescriptionStatus;
import com.mediorder.service.FileStorageService;
import com.mediorder.service.PrescriptionCleanupService;
import com.mediorder.service.PrescriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/prescriptions", "/api/prescriptions"})
@CrossOrigin(origins = "*")
public class PrescriptionController {

    @Autowired
    private PrescriptionService prescriptionService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private PrescriptionCleanupService cleanupService;

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

    @GetMapping
    public ResponseEntity<List<PrescriptionResponse>> getAllPrescriptions(
            @RequestParam(value = "status", required = false) PrescriptionStatus status,
            @RequestParam(value = "chronicOnly", required = false, defaultValue = "false") Boolean chronicOnly,
            Authentication authentication) {

        return ResponseEntity.ok(prescriptionService.getAllPrescriptions(status, chronicOnly, authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionResponse> getPrescriptionById(
            @PathVariable Long id,
            Authentication authentication) {

        return ResponseEntity.ok(prescriptionService.getPrescriptionById(id, authentication));
    }

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

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> getPrescriptionFileByStoredName(
            @PathVariable String fileName,
            Authentication authentication) {

        Resource resource = fileStorageService.loadFileAsResource(fileName);
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

    @PutMapping("/{id}/verify")
    public ResponseEntity<PrescriptionResponse> verifyPrescription(
            @PathVariable Long id,
            @RequestBody PrescriptionVerificationRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(prescriptionService.verifyPrescription(id, request, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrescription(
            @PathVariable Long id,
            Authentication authentication) {

        prescriptionService.deletePrescription(id, authentication);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> triggerCleanup(Authentication authentication) {
        return ResponseEntity.ok(cleanupService.runCleanupManually());
    }
}
