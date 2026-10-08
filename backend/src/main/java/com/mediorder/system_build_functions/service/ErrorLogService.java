package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.model.ErrorLog;
import com.mediorder.system_build_functions.repository.ErrorLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ErrorLogService {

    private static final Logger log = LoggerFactory.getLogger(ErrorLogService.class);
    private final ErrorLogRepository errorLogRepository;

    public ErrorLogService(ErrorLogRepository errorLogRepository) {
        this.errorLogRepository = errorLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ErrorLog recordError(String source, String message, String stackTrace,
                                String route, Long userId, String userEmail, String severity) {
        ErrorLog error = ErrorLog.builder()
                .source(source != null ? source : "BACKEND")
                .message(message)
                .stackTrace(stackTrace)
                .route(route)
                .userId(userId)
                .userEmail(userEmail)
                .severity(severity != null ? severity : "ERROR")
                .resolved(false)
                .createdAt(LocalDateTime.now())
                .build();

        try {
            return errorLogRepository.save(error);
        } catch (Exception ex) {
            log.error("Failed to write error log to database: {}", ex.getMessage());
            return error;
        }
    }

    @Transactional(readOnly = true)
    public Page<ErrorLog> getErrors(boolean unresolvedOnly, int page, int size) {
        if (unresolvedOnly) {
            return errorLogRepository.findByResolvedFalseOrderByCreatedAtDesc(PageRequest.of(page, size));
        }
        return errorLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Transactional
    public ErrorLog resolveError(Long id, String resolvedBy, String notes) {
        ErrorLog error = errorLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Error log not found with id: " + id));
        error.setResolved(true);
        error.setResolvedBy(resolvedBy);
        error.setResolutionNotes(notes);
        return errorLogRepository.save(error);
    }
}
