package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.model.AuditLog;
import com.mediorder.system_build_functions.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(int page, int size) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getEntityAuditTrail(String entity, String entityId) {
        return auditLogRepository.findByEntityAndEntityIdOrderByCreatedAtDesc(entity, entityId);
    }
}
