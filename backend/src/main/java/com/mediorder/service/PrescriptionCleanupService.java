package com.mediorder.service;

import com.mediorder.model.Prescription;
import com.mediorder.model.PrescriptionStatus;
import com.mediorder.repository.PrescriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PrescriptionCleanupService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Value("${app.upload.retention-days-rejected:7}")
    private int retentionDaysRejected;

    /**
     * Nightly scheduled auto-deletion cleanup at 2:00 AM.
     * Enforces conditional auto-deletion:
     * - Only purges non-chronic rejected prescriptions older than retention threshold.
     * - Chronic subscriptions are preserved indefinitely until explicitly deleted by pharmacist.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void scheduledCleanup() {
        System.out.println("[PrescriptionCleanupService] Starting scheduled conditional auto-deletion...");
        Map<String, Object> results = runCleanupManually();
        System.out.println("[PrescriptionCleanupService] Cleanup completed: " + results);
    }

    public Map<String, Object> runCleanupManually() {
        Map<String, Object> summary = new HashMap<>();

        // 1. Purge expired rejected prescription files (excluding chronic subscriptions)
        LocalDateTime threshold = LocalDateTime.now().minusDays(retentionDaysRejected);
        List<Prescription> candidates = prescriptionRepository
                .findByStatusAndChronicSubscriptionFalseAndIsFileDeletedFalseAndVerifiedAtBefore(
                        PrescriptionStatus.REJECTED,
                        threshold
                );

        int purgedFilesCount = 0;
        for (Prescription p : candidates) {
            if (p.getStoredFileName() != null) {
                boolean deleted = fileStorageService.deleteFile(p.getStoredFileName());
                if (deleted || !fileStorageService.fileExists(p.getStoredFileName())) {
                    p.setIsFileDeleted(true);
                    p.setFileUrl("[FILE_AUTO_DELETED_PER_RETENTION_POLICY]");
                    prescriptionRepository.save(p);
                    purgedFilesCount++;
                }
            }
        }

        // 2. Clean up orphaned files in upload directory that have no DB association
        int orphanedFilesCount = cleanupOrphanedFiles();

        summary.put("purgedRejectedFiles", purgedFilesCount);
        summary.put("orphanedFilesCleaned", orphanedFilesCount);
        summary.put("retentionDays", retentionDaysRejected);
        summary.put("timestamp", LocalDateTime.now().toString());
        return summary;
    }

    private int cleanupOrphanedFiles() {
        int count = 0;
        try {
            Path storageDir = fileStorageService.getFileStorageLocation();
            if (!Files.exists(storageDir)) return 0;

            Set<String> activeStoredFileNames = prescriptionRepository.findAll().stream()
                    .map(Prescription::getStoredFileName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            try (DirectoryStream<Path> stream = Files.newDirectoryStream(storageDir)) {
                for (Path entry : stream) {
                    if (Files.isRegularFile(entry)) {
                        String fileName = entry.getFileName().toString();
                        if (!activeStoredFileNames.contains(fileName)) {
                            try {
                                Files.deleteIfExists(entry);
                                count++;
                            } catch (IOException e) {
                                System.err.println("Could not delete orphan file " + fileName + ": " + e.getMessage());
                            }
                        }
                    }
                }
            }
        } catch (IOException ex) {
            System.err.println("Error scanning for orphaned files: " + ex.getMessage());
        }
        return count;
    }
}
