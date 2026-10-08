package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.model.AuditLog;
import com.mediorder.system_build_functions.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditService auditService;

    private AuditLog sampleLog;

    @BeforeEach
    void setUp() {
        sampleLog = AuditLog.builder()
                .id(1L)
                .actorId(10L)
                .actorEmail("pharmacist@mediorder.com")
                .actorRole("CHIEF_PHARMACIST")
                .action("APPROVE_PRESCRIPTION")
                .entity("Prescription")
                .entityId("101")
                .beforeState("PENDING")
                .afterState("APPROVED")
                .ipAddress("127.0.0.1")
                .build();
    }

    @Test
    void testLog_Success() {
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(sampleLog);

        AuditLog result = auditService.log(10L, "pharmacist@mediorder.com", "CHIEF_PHARMACIST",
                "APPROVE_PRESCRIPTION", "Prescription", "101", "PENDING", "APPROVED", "127.0.0.1");

        assertNotNull(result);
        assertEquals("APPROVE_PRESCRIPTION", result.getAction());
        assertEquals("Prescription", result.getEntity());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testGetAuditLogs() {
        Page<AuditLog> page = new PageImpl<>(List.of(sampleLog));
        when(auditLogRepository.findAllByOrderByCreatedAtDesc(any(PageRequest.class))).thenReturn(page);

        Page<AuditLog> result = auditService.getAuditLogs(0, 10);
        assertEquals(1, result.getTotalElements());
        assertEquals("APPROVE_PRESCRIPTION", result.getContent().get(0).getAction());
    }
}
