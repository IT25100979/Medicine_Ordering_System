package com.mediorder.it25101923_prescription_management.service;

import com.mediorder.it25101923_prescription_management.dto.PrescriptionResponse;
import com.mediorder.it25101923_prescription_management.dto.PrescriptionVerificationRequest;
import com.mediorder.system_build_functions.model.Notification;
import com.mediorder.system_build_functions.model.NotificationChannel;
import com.mediorder.it25101923_prescription_management.model.Prescription;
import com.mediorder.it25101923_prescription_management.model.PrescriptionStatus;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.repository.NotificationRepository;
import com.mediorder.it25101923_prescription_management.repository.PrescriptionRepository;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PrescriptionService {

    /** System Admin kill switch; optional so unit tests without it still work. */
    @Autowired(required = false)
    private com.mediorder.system_build_functions.service.FeatureFlagService featureFlagService;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private NotificationRepository notificationRepository;

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
        return r == Role.PHARMACIST || r == Role.CHIEF_PHARMACIST || r == Role.ADMIN || r == Role.SYSTEM_ADMIN
                || r == Role.OPERATIONS_MANAGER || r == Role.FINANCE_MANAGER;
    }

    private void assertPrescriptionsEnabled() {
        if (featureFlagService != null) {
            featureFlagService.assertFeatureEnabled(
                    com.mediorder.system_build_functions.service.FeatureKeys.PRESCRIPTIONS, "Prescription intake and review");
        }
    }

    /**
     * Upload with delivery details, so the pharmacist can dispense straight to the customer's door.
     * Address/phone are validated here because they arrive as multipart form fields.
     */
    public PrescriptionResponse uploadPrescription(
            MultipartFile file,
            String doctorName,
            String patientNotes,
            Boolean chronicSubscription,
            Authentication authentication,
            String deliveryAddress,
            String contactPhone,
            String preferredCourier) {
        String address = deliveryAddress != null && !deliveryAddress.isBlank() ? deliveryAddress.trim() : null;
        String phone = contactPhone != null && !contactPhone.isBlank() ? contactPhone.trim() : null;
        if (address != null && (address.length() < 5 || address.length() > 500)) {
            throw new IllegalArgumentException("Delivery address must be between 5 and 500 characters.");
        }
        if (phone != null && !com.mediorder.system_build_functions.validation.PhoneNumberValidator.isValid(phone)) {
            throw new IllegalArgumentException("Enter a valid phone number, e.g. 0771234567 or +94771234567");
        }
        if (preferredCourier != null && preferredCourier.length() > 50) {
            throw new IllegalArgumentException("Unknown delivery partner.");
        }
        PrescriptionResponse uploaded = uploadPrescription(file, doctorName, patientNotes, chronicSubscription, authentication);
        if (address == null && phone == null && preferredCourier == null) {
            return uploaded;
        }
        Prescription saved = prescriptionRepository.findById(uploaded.getId()).orElseThrow();
        saved.setDeliveryAddress(address);
        saved.setContactPhone(phone);
        saved.setPreferredCourier(preferredCourier != null && !preferredCourier.isBlank() ? preferredCourier.trim() : null);
        return PrescriptionResponse.fromEntity(prescriptionRepository.save(saved));
    }

    public PrescriptionResponse uploadPrescription(
            MultipartFile file,
            String doctorName,
            String patientNotes,
            Boolean chronicSubscription,
            Authentication authentication) {
        assertPrescriptionsEnabled();

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
        return getAllPrescriptions(status, chronicOnly, null, authentication);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAllPrescriptions(
            PrescriptionStatus status,
            Boolean chronicOnly,
            String search,
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
            if (search != null && !search.trim().isEmpty()) {
                // When search is requested by staff, search across ALL prescriptions in the DB (Approved, Rejected, Pending, Chronic)
                String q = search.trim().toLowerCase();
                return prescriptionRepository.findAllByOrderByCreatedAtDesc().stream()
                        .filter(p -> matchesPrescriptionSearch(p, q))
                        .map(PrescriptionResponse::fromEntity)
                        .collect(Collectors.toList());
            }

            if (Boolean.TRUE.equals(chronicOnly)) {
                list = prescriptionRepository.findByChronicSubscriptionTrueOrderByCreatedAtDesc();
            } else if (status != null) {
                list = prescriptionRepository.findByStatusOrderByCreatedAtDesc(status);
            } else {
                list = prescriptionRepository.findAllByOrderByCreatedAtDesc();
            }
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream()
                    .filter(p -> matchesPrescriptionSearch(p, q))
                    .collect(Collectors.toList());
        }

        return list.stream()
                .map(PrescriptionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private boolean matchesPrescriptionSearch(Prescription p, String q) {
        if (p == null) return false;
        boolean matchId = p.getId() != null && String.valueOf(p.getId()).contains(q);
        boolean matchCustId = p.getCustomer() != null && p.getCustomer().getId() != null && String.valueOf(p.getCustomer().getId()).contains(q);
        boolean matchCustEmail = p.getCustomer() != null && p.getCustomer().getEmail() != null && p.getCustomer().getEmail().toLowerCase().contains(q);
        boolean matchCustName = p.getCustomer() != null && p.getCustomer().getFullName() != null && p.getCustomer().getFullName().toLowerCase().contains(q);
        boolean matchDoctor = p.getDoctorName() != null && p.getDoctorName().toLowerCase().contains(q);
        boolean matchStatus = p.getStatus() != null && p.getStatus().name().toLowerCase().contains(q);
        return matchId || matchCustId || matchCustEmail || matchCustName || matchDoctor || matchStatus;
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found with ID: " + id));

        if (!isStaffUser(currentUser) && !p.getCustomer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You are not authorized to view this prescription.");
        }

        return PrescriptionResponse.fromEntity(p);
    }

    public PrescriptionResponse verifyPrescription(
            Long id,
            PrescriptionVerificationRequest request,
            Authentication authentication) {
        assertPrescriptionsEnabled();

        User pharmacist = getAuthenticatedUser(authentication);
        if (!isStaffUser(pharmacist)) {
            throw new AccessDeniedException("Only licensed clinical staff and administrators can verify prescriptions.");
        }

        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found with ID: " + id));

        if (p.getStatus() != PrescriptionStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Prescription #" + id + " has already been finalized as " + p.getStatus() + " and cannot be re-reviewed.");
        }

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
            // Send user notification with rejection reason
            if (p.getCustomer() != null && notificationRepository != null) {
                String reasonText = (request.getRejectionReason() != null && !request.getRejectionReason().isBlank())
                        ? request.getRejectionReason()
                        : "Requirements not met";
                String notesText = (request.getVerificationNotes() != null && !request.getVerificationNotes().isBlank())
                        ? " - " + request.getVerificationNotes()
                        : "";
                Notification rejectionNotification = new Notification();
                rejectionNotification.setRecipient(p.getCustomer());
                rejectionNotification.setTitle("Prescription #" + p.getId() + " Review Notice: Rejected");
                rejectionNotification.setMessage("Your prescription was reviewed and rejected. Reason: " + reasonText + notesText);
                rejectionNotification.setChannel(NotificationChannel.IN_APP);
                rejectionNotification.setIsRead(false);
                rejectionNotification.setSentAt(LocalDateTime.now());
                notificationRepository.save(rejectionNotification);
            }

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
        } else if (request.getStatus() == PrescriptionStatus.APPROVED) {
            if (p.getCustomer() != null && notificationRepository != null) {
                Notification approvalNotification = new Notification();
                approvalNotification.setRecipient(p.getCustomer());
                approvalNotification.setTitle("Prescription #" + p.getId() + " Approved");
                approvalNotification.setMessage("Your prescription #" + p.getId() + " has been approved by our licensed clinical pharmacist and is cleared for dispensing.");
                approvalNotification.setChannel(NotificationChannel.IN_APP);
                approvalNotification.setIsRead(false);
                approvalNotification.setSentAt(LocalDateTime.now());
                notificationRepository.save(approvalNotification);
            }
        }

        Prescription saved = prescriptionRepository.save(p);
        return PrescriptionResponse.fromEntity(saved);
    }

    public void deletePrescription(Long id, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found with ID: " + id));

        // Ownership and permission check
        if (!isStaffUser(currentUser)) {
            if (!p.getCustomer().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You do not have permission to delete this prescription.");
            }
            if (p.getStatus() != PrescriptionStatus.PENDING) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Customers can only cancel prescriptions that are still PENDING review.");
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found with ID: " + id));

        if (!isStaffUser(currentUser) && !p.getCustomer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You are not authorized to view this prescription document.");
        }

        if (Boolean.TRUE.equals(p.getIsFileDeleted())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Prescription document file has been deleted per policy.");
        }

        return fileStorageService.loadFileAsResource(p.getStoredFileName());
    }

    @Transactional(readOnly = true)
    public Prescription getPrescriptionEntity(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found with ID: " + id));
    }
}


