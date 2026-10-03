package com.mediorder.service;

import com.mediorder.dto.PrescriptionResponse;
import com.mediorder.dto.PrescriptionVerificationRequest;
import com.mediorder.model.Prescription;
import com.mediorder.model.PrescriptionStatus;
import com.mediorder.model.Role;
import com.mediorder.model.User;
import com.mediorder.repository.PrescriptionRepository;
import com.online_pharmacy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.upload.auto-delete-rejected-files:false}")
    private boolean autoDeleteRejectedFiles;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found with email: " + authentication.getName()));
    }

    private boolean isStaffUser(User user) {
        if (user == null || user.getRole() == null) return false;
        Role r = user.getRole();
        return r == Role.PHARMACIST || r == Role.CHIEF_PHARMACIST || r == Role.ADMIN || r == Role.OPERATIONS_MANAGER;
    }

    public PrescriptionResponse uploadPrescription(
            MultipartFile file,
            String doctorName,
            String patientNotes,
            Boolean chronicSubscription,
            Authentication authentication) {

        User customer = getAuthenticatedUser(authentication);
        String storedFileName = fileStorageService.storeFile(file);

        Prescription prescription = Prescription.builder()
                .customer(customer)
                .fileUrl("/api/v1/prescriptions/files/" + storedFileName)
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .contentType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .doctorName(doctorName)
                .patientNotes(patientNotes)
                .chronicSubscription(Boolean.TRUE.equals(chronicSubscription))
                .status(PrescriptionStatus.PENDING)
                .isFileDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        Prescription saved = prescriptionRepository.save(prescription);
        return PrescriptionResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAllPrescriptions(
            PrescriptionStatus status,
            Boolean chronicOnly,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);
        List<Prescription> list;

        if (!isStaffUser(currentUser)) {
            // Regular customer: only view own prescriptions
            if (status != null) {
                list = prescriptionRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), status);
            } else {
                list = prescriptionRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser.getId());
            }
        } else {
            // Staff: Pharmacist / Admin
            if (Boolean.TRUE.equals(chronicOnly)) {
                list = prescriptionRepository.findByChronicSubscriptionTrueOrderByCreatedAtDesc();
            } else if (status != null) {
                list = prescriptionRepository.findByStatusOrderByCreatedAtDesc(status);
            } else {
                list = prescriptionRepository.findAllByOrderByCreatedAtDesc();
            }
        }

        return list.stream()
                .map(PrescriptionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));

        if (!isStaffUser(currentUser) && !p.getCustomer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You are not authorized to view this prescription.");
        }

        return PrescriptionResponse.fromEntity(p);
    }

    public PrescriptionResponse verifyPrescription(
            Long id,
            PrescriptionVerificationRequest request,
            Authentication authentication) {

        User pharmacist = getAuthenticatedUser(authentication);
        if (!isStaffUser(pharmacist)) {
            throw new AccessDeniedException("Only licensed clinical staff and administrators can verify prescriptions.");
        }

        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));

        if (request.getStatus() == null) {
            throw new IllegalArgumentException("Verification status must be either APPROVED or REJECTED.");
        }

        p.setStatus(request.getStatus());
        p.setVerifiedBy(pharmacist);
        p.setVerifiedAt(LocalDateTime.now());
        p.setVerificationNotes(request.getVerificationNotes());
        p.setRejectionReason(request.getRejectionReason());

        // Conditional Auto-Deletion Logic
        if (request.getStatus() == PrescriptionStatus.REJECTED) {
            // Chronic Subscription Check:
            // If chronicSubscription is TRUE, the prescription and its file MUST be preserved
            // until a pharmacist/administrator explicitly deletes it.
            if (Boolean.TRUE.equals(p.getChronicSubscription())) {
                // Preserved: Do not auto-delete.
            } else {
                // Non-chronic: If immediate deletion is requested or configured, purge file from disk
                boolean deleteNow = Boolean.TRUE.equals(request.getDeleteFileImmediately()) || autoDeleteRejectedFiles;
                if (deleteNow && p.getStoredFileName() != null && !Boolean.TRUE.equals(p.getIsFileDeleted())) {
                    fileStorageService.deleteFile(p.getStoredFileName());
                    p.setIsFileDeleted(true);
                    p.setFileUrl("[FILE_AUTO_DELETED_UPON_REJECTION]");
                }
            }
        }

        Prescription saved = prescriptionRepository.save(p);
        return PrescriptionResponse.fromEntity(saved);
    }

    public void deletePrescription(Long id, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));

        // Ownership and permission check
        if (!isStaffUser(currentUser)) {
            if (!p.getCustomer().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You do not have permission to delete this prescription.");
            }
            if (p.getStatus() != PrescriptionStatus.PENDING) {
                throw new IllegalStateException("Customers can only cancel prescriptions that are still PENDING review.");
            }
        }

        // Immediately purge physical file from disk
        if (p.getStoredFileName() != null && !Boolean.TRUE.equals(p.getIsFileDeleted())) {
            fileStorageService.deleteFile(p.getStoredFileName());
        }

        prescriptionRepository.delete(p);
    }

    @Transactional(readOnly = true)
    public Resource getFileResource(Long id, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));

        if (!isStaffUser(currentUser) && !p.getCustomer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You are not authorized to view this prescription document.");
        }

        if (Boolean.TRUE.equals(p.getIsFileDeleted())) {
            throw new RuntimeException("Prescription document file has been deleted per policy.");
        }

        return fileStorageService.loadFileAsResource(p.getStoredFileName());
    }

    @Transactional(readOnly = true)
    public Prescription getPrescriptionEntity(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));
    }
}
