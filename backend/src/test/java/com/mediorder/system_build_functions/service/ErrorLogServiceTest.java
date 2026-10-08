package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.model.ErrorLog;
import com.mediorder.system_build_functions.repository.ErrorLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ErrorLogServiceTest {

    @Mock
    private ErrorLogRepository errorLogRepository;

    @InjectMocks
    private ErrorLogService errorLogService;

    private ErrorLog sampleError;

    @BeforeEach
    void setUp() {
        sampleError = ErrorLog.builder()
                .id(1L)
                .source("BACKEND")
                .message("NullPointerException in payment gateway")
                .severity("FATAL")
                .resolved(false)
                .build();
    }

    @Test
    void testRecordError_Success() {
        when(errorLogRepository.save(any(ErrorLog.class))).thenReturn(sampleError);

        ErrorLog logged = errorLogService.recordError("BACKEND", "NullPointerException in payment gateway",
                "stacktrace here", "/api/v1/orders", 5L, "cust@mediorder.com", "FATAL");

        assertNotNull(logged);
        assertEquals("FATAL", logged.getSeverity());
        verify(errorLogRepository, times(1)).save(any(ErrorLog.class));
    }

    @Test
    void testResolveError() {
        when(errorLogRepository.findById(1L)).thenReturn(Optional.of(sampleError));
        when(errorLogRepository.save(any(ErrorLog.class))).thenReturn(sampleError);

        ErrorLog resolved = errorLogService.resolveError(1L, "it@mediorder.com", "Fixed null check in payment provider");

        assertTrue(resolved.getResolved());
        assertEquals("it@mediorder.com", resolved.getResolvedBy());
    }
}
