package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.dto.AuditLogCreateRequest;
import com.mediorder.system_build_functions.dto.AuditLogUpdateRequest;
import com.mediorder.system_build_functions.model.AuditLog;
import com.mediorder.system_build_functions.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog log(Long actorId, String actorEmail, String actorRole,
                        String action, String entity, String entityId,
                        String beforeState, String afterState, String ipAddress) {
        AuditLog entry = AuditLog.builder()
                .actorId(actorId)
                .actorEmail(actorEmail != null ? actorEmail : "system")
                .actorRole(actorRole != null ? actorRole : "SYSTEM")
                .action(action)
                .entity(entity)
                .entityId(entityId)
                .beforeState(beforeState)
                .afterState(afterState)
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .createdAt(LocalDateTime.now())
                .build();

        try {
            AuditLog saved = auditLogRepository.save(entry);
            log.info("AUDIT: [{}] {} on {} id={} by {} ({})", action, entity, entityId, actorEmail, actorRole);
            return saved;
        } catch (Exception ex) {
            log.error("Failed to save audit log: {}", ex.getMessage(), ex);
            return entry;
        }
    }

    public AuditLog logAction(String action, String entity, String entityId, String beforeState, String afterState) {
        return log(null, "system@mediorder.com", "SYSTEM", action, entity, entityId, beforeState, afterState, "127.0.0.1");
    }

    public AuditLog logUserAction(String actorEmail, String actorRole, String action, String entity, String entityId, String details) {
        return log(null, actorEmail, actorRole, action, entity, entityId, null, details, "127.0.0.1");
    }

    @Transactional
    public AuditLog createDepartmentAudit(AuditLogCreateRequest req, String adminEmail, String adminRole) {
        String email = (req.getActorEmail() != null && !req.getActorEmail().isBlank()) ? req.getActorEmail() : adminEmail;
        String role = (req.getActorRole() != null && !req.getActorRole().isBlank()) ? req.getActorRole() : (adminRole != null ? adminRole : "SYSTEM_ADMIN");

        AuditLog entry = AuditLog.builder()
                .department(req.getDepartment())
                .action(req.getAction())
                .entity(req.getEntity())
                .entityId(req.getEntityId())
                .beforeState(req.getBeforeState())
                .afterState(req.getAfterState() != null ? req.getAfterState() : req.getNotes())
                .severity(req.getSeverity() != null ? req.getSeverity() : "INFO")
                .actorEmail(email)
                .actorRole(role)
                .ipAddress("127.0.0.1")
                .createdAt(LocalDateTime.now())
                .build();

        AuditLog saved = auditLogRepository.save(entry);
        log.info("DEPARTMENT AUDIT CREATED: [dept={}] [action={}] by {}", req.getDepartment(), req.getAction(), email);
        return saved;
    }

    @Transactional
    public AuditLog updateAuditLog(Long id, AuditLogUpdateRequest req, String adminEmail) {
        AuditLog existing = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audit log not found with id: " + id));

        if (req.getDepartment() != null && !req.getDepartment().isBlank()) existing.setDepartment(req.getDepartment());
        if (req.getAction() != null && !req.getAction().isBlank()) existing.setAction(req.getAction());
        if (req.getEntity() != null && !req.getEntity().isBlank()) existing.setEntity(req.getEntity());
        if (req.getEntityId() != null) existing.setEntityId(req.getEntityId());
        if (req.getBeforeState() != null) existing.setBeforeState(req.getBeforeState());
        if (req.getAfterState() != null) existing.setAfterState(req.getAfterState());
        if (req.getSeverity() != null) existing.setSeverity(req.getSeverity());

        AuditLog saved = auditLogRepository.save(existing);
        log.info("AUDIT LOG UPDATED: id={} by {}", id, adminEmail);
        return saved;
    }

    @Transactional
    public void deleteAuditLog(Long id, String adminEmail) {
        AuditLog existing = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audit log not found with id: " + id));
        auditLogRepository.delete(existing);
        log.warn("AUDIT LOG DELETED: id={} by {}", id, adminEmail);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(int page, int size) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsByDepartment(String department, int page, int size) {
        if (department != null && !department.isBlank() && !department.equalsIgnoreCase("ALL")) {
            return auditLogRepository.findByDepartmentFilter(department, PageRequest.of(page, size));
        }
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getEntityAuditTrail(String entity, String entityId) {
        return auditLogRepository.findByEntityAndEntityIdOrderByCreatedAtDesc(entity, entityId);
    }
}
