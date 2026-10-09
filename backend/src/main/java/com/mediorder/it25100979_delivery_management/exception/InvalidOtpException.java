package com.mediorder.it25100979_delivery_management.exception;

/** Wrong or expired handover OTP entered by the courier (HTTP 400). */
public class InvalidOtpException extends RuntimeException {
    public InvalidOtpException(String message) {
        super(message);
    }
}
