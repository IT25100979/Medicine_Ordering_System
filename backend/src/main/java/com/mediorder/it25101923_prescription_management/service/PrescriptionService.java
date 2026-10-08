package com.mediorder.it25101923_prescription_management.service;

import com.mediorder.it25101923_prescription_management.dto.*;
import com.mediorder.it25101923_prescription_management.model.*;
import com.mediorder.it25101923_prescription_management.repository.*;
import com.mediorder.it25101923_prescription_management.strategy.PrescriptionRetentionStrategy;
import com.mediorder.system_build_functions.model.*;
import com.mediorder.system_build_functions.repository.*;
import com.mediorder.it25103946_order_processing_and_workflow.model.Order;
import com.mediorder.it25103946_order_processing_and_workflow.model.OrderStatus;
import com.mediorder.it25103946_order_processing_and_workflow.repository.OrderRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service implementation for Prescription Management System
 * IT25101923
 *
 * Handles prescription upload, SHA-256 fingerprint deduplication, clinical review,
 * status transitions, order usage linking, audit history, and retention policies.
 */
@Service
@Transactional
public class PrescriptionService {

    private static final Logger log = LoggerFactory.getLogger(PrescriptionService.class);

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private NotificationRepository notificationRepository;

    @Autowired
    private List<PrescriptionRetentionStrategy> retentionStrategies;

    @Autowired
    private PrescriptionAuditRepository auditRepository;

    @Autowired
    private PrescriptionFingerprintRepository fingerprintRepository;

    @Autowired
    private PrescriptionUsageRepository usageRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PrescriptionDocumentPurgeService purgeService;

    @Value("${app.upload.auto-delete-rejected-files:false}")
    private boolean autoDeleteRejectedFiles;

    // ─── Helper Methods ─────────────────────────────────────────────

    private User current(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            throw new AccessDeniedException("Please sign in.");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("Account not found."));
    }

    private boolean isStaff(User user) {
        return user.getRole() == Role.PHARMACIST
                || user.getRole() == Role.CHIEF_PHARMACIST
                || user.getRole() == Role.ADMIN;
    }

    private void requireStaff(User user) {
        if (!isStaff(user)) {
            throw new AccessDeniedException("Only licensed clinical staff and administrators can verify prescriptions.");
        }
    }

// Add this new method here:
public void requireClinicalStaff(Authentication authentication) {
    requireStaff(current(authentication));
}

    private Prescription find(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found."));
    }

    private void authorize(Prescription p, User user) {
        if (!isStaff(user) && (p.getCustomer() == null || !Objects.equals(p.getCustomer().getId(), user.getId()))) {
            throw new AccessDeniedException("You are not authorized to view this prescription.");
        }
    }

    private void active(Prescription p) {
        if (Boolean.TRUE.equals(p.getArchived())) {
            throw new ResponseStatusException(HttpStatus.GONE, "This prescription has been removed.");
        }
    }

    private void editable(Prescription p) {
        active(p);
        if (p.getStatus() != PrescriptionStatus.PENDING && p.getStatus() != PrescriptionStatus.CLARIFICATION_REQUIRED) {
            throw new IllegalStateException("Only pending submissions or submissions needing clarification can be edited.");
        }
    }

    private String bounded(String value, int limit, String label) {
        String text = (value == null) ? null : value.trim();
        if (text != null && text.length() > limit) {
            throw new IllegalArgumentException(label + " must be at most " + limit + " characters.");
        }
        return text;
    }

    private void audit(Prescription p, User actor, String action, PrescriptionStatus from, String details) {
        auditRepository.save(new PrescriptionAudit(
                p.getId(),
                actor.getId(),
                actor.getFullName(),
                action,
                from == null ? null : from.name(),
                p.getStatus().name(),
                details
        ));
    }

    private void notifyCustomer(Prescription p, String title, String message) {
        if (notificationRepository == null) return;
        Notification n = new Notification();
        n.setRecipient(p.getCustomer());
        n.setTitle(title);
        n.setMessage(message);
        n.setChannel(NotificationChannel.IN_APP);
        n.setIsRead(false);
        n.setSentAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    private String fingerprint(MultipartFile file) {
        fileStorageService.validateFile(file);
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(file.getBytes()));
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not read the document.", e);
        }
    }

    private void ensureNewFingerprint(String hash) {
        if (fingerprintRepository.existsById(hash) || prescriptionRepository.existsByFileSha256(hash)) {
            throw new IllegalStateException("This document has already been submitted. Use the existing prescription or upload a newly issued document.");
        }
    }

    private String store(MultipartFile file) {
        String name = fileStorageService.storeFile(file);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) {
                        fileStorageService.deleteFile(name);
                    }
                }
            });
        }
        return name;
    }

    private void applyFile(Prescription p, MultipartFile file, String name, String hash) {
        p.setFileUrl("/api/v1/prescriptions/" + p.getId() + "/file");
        p.setStoredFileName(name);
        p.setOriginalFileName(file.getOriginalFilename());
        p.setContentType(fileStorageService.detectContentType(file));
        p.setFileSizeBytes(file.getSize());
        p.setFileSha256(hash);
        p.setIsFileDeleted(false);
    }

    // ─── Public Business Operations ─────────────────────────────────

    /**
     * Upload a new prescription document.
     */
    public PrescriptionResponse uploadPrescription(
            MultipartFile file,
            String doctorName,
            String patientNotes,
            Boolean chronic,
            Authentication auth) {

        User actor = current(auth);
        if (actor.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("Only customer accounts can submit prescriptions.");
        }

        String doctor = bounded(doctorName, 150, "Doctor name");
        String notes = bounded(patientNotes, 2000, "Notes");
        String hash = fingerprint(file);

        ensureNewFingerprint(hash);
        String name = store(file);

        Prescription p = Prescription.builder()
                .customer(actor)
                .doctorName(doctor)
                .patientNotes(notes)
                .chronicSubscription(Boolean.TRUE.equals(chronic))
                .status(PrescriptionStatus.PENDING)
                .fileUrl("/api/v1/prescriptions/files/" + name)
                .storedFileName(name)
                .originalFileName(file.getOriginalFilename())
                .contentType(fileStorageService.detectContentType(file))
                .fileSizeBytes(file.getSize())
                .isFileDeleted(false)
                .build();

        p.setFileSha256(hash);
        p = prescriptionRepository.saveAndFlush(p);
        p.setFileUrl("/api/v1/prescriptions/" + p.getId() + "/file");

        fingerprintRepository.saveAndFlush(new PrescriptionFingerprint(hash, p.getId()));
        audit(p, actor, "UPLOADED", null, "Document submitted for review.");

        return PrescriptionResponse.fromEntity(p);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAllPrescriptions(
            PrescriptionStatus status,
            Boolean chronic,
            Authentication auth) {
        return getAllPrescriptions(status, chronic, null, auth);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAllPrescriptions(
            PrescriptionStatus status,
            Boolean chronic,
            String search,
            Authentication auth) {

        User actor = current(auth);
        List<Prescription> all = isStaff(actor)
                ? prescriptionRepository.findAllByOrderByCreatedAtDesc()
                : prescriptionRepository.findByCustomerIdOrderByCreatedAtDesc(actor.getId());

        String q = (search == null) ? "" : search.trim().toLowerCase(Locale.ROOT);

        return all.stream()
                .filter(p -> !Boolean.TRUE.equals(p.getArchived()))
                .filter(p -> status == null || p.getStatus() == status)
                .filter(p -> !Boolean.TRUE.equals(chronic) || Boolean.TRUE.equals(p.getChronicSubscription()))
                .filter(p -> q.isEmpty() || matches(p, q))
                .map(PrescriptionResponse::fromEntity)
                .toList();
    }

    private boolean matches(Prescription p, String q) {
        String haystack = (p.getId() + " " + p.getDoctorName() + " " + p.getStatus() + " "
                + p.getCustomer().getId() + " " + p.getCustomer().getFullName() + " "
                + p.getCustomer().getEmail()).toLowerCase(Locale.ROOT);
        return haystack.contains(q);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id, Authentication auth) {
        Prescription p = find(id);
        authorize(p, current(auth));
        return PrescriptionResponse.fromEntity(p);
    }

    /**
     * Resubmit or update prescription details.
     */
    public PrescriptionResponse updatePrescription(
            Long id,
            PrescriptionUpdateRequest request,
            MultipartFile file,
            Authentication auth) {

        User actor = current(auth);
        Prescription p = find(id);
        authorize(p, actor);
        editable(p);

        if (request.version() != null && !Objects.equals(request.version(), p.getVersion())) {
            throw new IllegalStateException("This submission changed. Refresh before editing.");
        }

        String doctor = bounded(request.doctorName(), 150, "Doctor name");
        String notes = bounded(request.patientNotes(), 2000, "Notes");

        if (file != null && !file.isEmpty()) {
            String hash = fingerprint(file);
            if (!Objects.equals(hash, p.getFileSha256())) {
                ensureNewFingerprint(hash);
                String old = p.getStoredFileName();
                String name = store(file);
                applyFile(p, file, name, hash);
                fingerprintRepository.saveAndFlush(new PrescriptionFingerprint(hash, id));

                if (TransactionSynchronizationManager.isSynchronizationActive()) {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            if (old != null) fileStorageService.deleteFile(old);
                        }
                    });
                }
            }
        }

        PrescriptionStatus from = p.getStatus();
        p.setDoctorName(doctor);
        p.setPatientNotes(notes);
        p.setChronicSubscription(Boolean.TRUE.equals(request.chronicSubscription()));
        p.setStatus(PrescriptionStatus.PENDING);
        p.setRejectionReason(null);
        p.setRejectionCode(null);
        p.setVerificationNotes(null);
        p.setVerifiedAt(null);
        p.setVerifiedBy(null);

        prescriptionRepository.saveAndFlush(p);
        audit(p, actor, from == PrescriptionStatus.CLARIFICATION_REQUIRED ? "RESUBMITTED" : "UPDATED", from, "Submission updated and ready for review.");

        return PrescriptionResponse.fromEntity(p);
    }

    /**
     * Pharmacist verification: approve/reject/request clarification.
     */
    public PrescriptionResponse verifyPrescription(
            Long id,
            PrescriptionVerificationRequest request,
            Authentication auth) {

        User actor = current(auth);
        requireStaff(actor);
        Prescription p = find(id);
        active(p);

        if (p.getStatus() != PrescriptionStatus.PENDING) {
            throw new IllegalStateException("Prescription #" + id + " has already been finalized as " + p.getStatus() + " and cannot be re-reviewed.");
        }

        if (request.getStatus() == null) {
            throw new IllegalArgumentException("Verification status is required.");
        }

        if (request.getStatus() != PrescriptionStatus.APPROVED
                && request.getStatus() != PrescriptionStatus.REJECTED
                && request.getStatus() != PrescriptionStatus.CLARIFICATION_REQUIRED) {
            throw new IllegalArgumentException("Choose approve, reject, or request clarification.");
        }

        String notes = bounded(request.getVerificationNotes(), 2000, "Review notes");
        RejectionCode code = null;
        String reason = null;

        if (request.getStatus() == PrescriptionStatus.REJECTED) {
            if (request.getRejectionCode() == null) {
                throw new IllegalArgumentException("Choose a rejection reason code.");
            }
            try {
                code = RejectionCode.valueOf(request.getRejectionCode());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid rejection reason code.");
            }
            reason = bounded(request.getRejectionReason(), 255, "Rejection reason");
            if (code == RejectionCode.OTHER && (reason == null || reason.isBlank())) {
                throw new IllegalArgumentException("Explain the rejection reason.");
            }
            if (reason == null || reason.isBlank()) {
                reason = code.getLabel();
            }
        }

        if (request.getStatus() == PrescriptionStatus.CLARIFICATION_REQUIRED && (notes == null || notes.isBlank())) {
            throw new IllegalArgumentException("Tell the customer what needs clarification.");
        }

        int maxUses = (request.getMaxUses() == null) ? 1 : request.getMaxUses();
        if (maxUses < 1 || maxUses > 12 || (!Boolean.TRUE.equals(p.getChronicSubscription()) && maxUses != 1)) {
            throw new IllegalArgumentException("Standard prescriptions allow one use. Chronic prescriptions allow 1 to 12 approved uses.");
        }

        PrescriptionStatus from = p.getStatus();
        p.setStatus(request.getStatus());
        p.setVerifiedBy(actor);
        p.setVerifiedAt(LocalDateTime.now());
        p.setVerificationNotes(notes);
        p.setRejectionReason(reason);
        p.setRejectionCode(code == null ? null : code.name());
        p.setMaxUses(maxUses);

        if (p.getStatus() == PrescriptionStatus.REJECTED
                && retentionStrategies.stream()
                .filter(s -> s.supports(p))
                .findFirst()
                .orElseThrow()
                .shouldDeleteRejectedFile(request, autoDeleteRejectedFiles)) {

            Long prescriptionId = p.getId();
            Long actorId = actor.getId();
            String actorName = actor.getFullName();

            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        purgeService.purge(prescriptionId, actorId, actorName);
                    } catch (RuntimeException ex) {
                        log.warn("Document purge will be retried by retention cleanup for prescription #{}", prescriptionId);
                    }
                }
            });
        }

        prescriptionRepository.saveAndFlush(p);
        audit(p, actor, p.getStatus().name(), from, reason != null ? reason : notes);

        notifyCustomer(p, "Prescription #" + id + ": " + p.getStatus().name().replace('_', ' '),
                p.getStatus() == PrescriptionStatus.CLARIFICATION_REQUIRED ? notes : reason != null ? reason : "Your prescription has been approved.");

        return PrescriptionResponse.fromEntity(p);
    }

    /**
     * Soft-delete a prescription record.
     */
    public void deletePrescription(Long id, Authentication auth) {
        User actor = current(auth);
        Prescription p = find(id);
        authorize(p, actor);
        active(p);

        if (!isStaff(actor)) {
            editable(p);
        }

        PrescriptionStatus from = p.getStatus();
        if (p.getStatus() == PrescriptionStatus.PENDING || p.getStatus() == PrescriptionStatus.CLARIFICATION_REQUIRED) {
            p.setStatus(PrescriptionStatus.CANCELLED);
        }

        p.setArchived(true);
        prescriptionRepository.saveAndFlush(p);
        audit(p, actor, "REMOVED", from, "Removed from active lists; history retained.");
    }

    @Transactional(readOnly = true)
    public Resource getFileResource(Long id, Authentication auth) {
        Prescription p = find(id);
        authorize(p, current(auth));
        active(p);

        if (Boolean.TRUE.equals(p.getIsFileDeleted())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Document has been removed under the retention policy.");
        }
        return fileStorageService.loadFileAsResource(p.getStoredFileName());
    }

    @Transactional(readOnly = true)
    public Resource getFileResourceByStoredName(String name, Authentication auth) {
        Prescription p = prescriptionRepository.findByStoredFileName(name)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found."));
        return getFileResource(p.getId(), auth);
    }

    @Transactional(readOnly = true)
    public Prescription getPrescriptionEntity(Long id) {
        return find(id);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionAudit> getAudit(Long id, Authentication auth) {
        Prescription p = find(id);
        authorize(p, current(auth));
        return auditRepository.findByPrescriptionIdOrderByCreatedAtAscIdAsc(id);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionUsage> getUsage(Long id, Authentication auth) {
        Prescription p = find(id);
        authorize(p, current(auth));
        return usageRepository.findByPrescriptionIdOrderByCreatedAtDesc(id);
    }

    /**
     * Link an approved prescription to a customer order fill.
     */
    public PrescriptionResponse recordUsage(Long id, Long orderId, Authentication auth) {
        User actor = current(auth);
        requireStaff(actor);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("A cancelled order cannot use a prescription.");
        }
        if (order.getPrescriptionId() != null && !Objects.equals(order.getPrescriptionId(), id)) {
            throw new IllegalStateException("This order is already linked to another prescription.");
        }

        Prescription p = reserveForOrder(id, order, actor);
        order.setPrescriptionId(id);
        orderRepository.save(order);

        return PrescriptionResponse.fromEntity(p);
    }

    public Prescription reserveForOrder(Long id, Order order, User actor) {
        Prescription p = prescriptionRepository.findForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found."));
        active(p);

        if (order.getCustomer() == null || !Objects.equals(order.getCustomer().getId(), p.getCustomer().getId())) {
            throw new AccessDeniedException("Order and prescription must belong to the same customer.");
        }
        if (!isStaff(actor) && !Objects.equals(actor.getId(), p.getCustomer().getId())) {
            throw new AccessDeniedException("Use your own prescription.");
        }
        if (p.getStatus() != PrescriptionStatus.APPROVED) {
            throw new IllegalStateException("Only approved prescriptions can be used.");
        }
        if (p.getUsedCount() >= p.getMaxUses()) {
            throw new IllegalStateException("This prescription has reached its approved usage limit.");
        }
        if (usageRepository.existsByPrescriptionIdAndOrderId(id, order.getId())) {
            throw new IllegalStateException("This prescription is already linked to this order.");
        }

        usageRepository.saveAndFlush(new PrescriptionUsage(id, order.getId(), actor.getId()));
        p.setUsedCount(p.getUsedCount() + 1);
        prescriptionRepository.saveAndFlush(p);

        audit(p, actor, "USED_FOR_ORDER", p.getStatus(), "Linked to order #" + order.getId() + ". Usage " + p.getUsedCount() + " of " + p.getMaxUses() + ".");
        return p;
    }
}
