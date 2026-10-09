package com.mediorder.it25100979_delivery_management.exception;

/** The cart contains prescription-only medicine but no valid approved prescription was given (HTTP 400). */
public class PrescriptionRequiredException extends RuntimeException {
    public PrescriptionRequiredException(String message) {
        super(message);
    }
}
