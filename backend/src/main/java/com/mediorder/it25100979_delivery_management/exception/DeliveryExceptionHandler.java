package com.mediorder.it25100979_delivery_management.exception;

import com.mediorder.system_build_functions.dto.ApiResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Maps delivery-specific exceptions to HTTP responses. Scoped to this module's controllers;
 * everything else falls through to the application-wide GlobalExceptionHandler.
 */
@RestControllerAdvice(basePackages = "com.mediorder.it25100979_delivery_management")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DeliveryExceptionHandler {

    @ExceptionHandler(DeliveryNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(DeliveryNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(InvalidDeliveryStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidState(InvalidDeliveryStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidOtp(InvalidOtpException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
    }
}
