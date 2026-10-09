package com.mediorder.it25100979_delivery_management.validation;

/** Regex patterns shared by the delivery DTOs. */
public final class ValidationPatterns {

    /** Sri Lankan / international phone: digits, spaces, '+' and '-' ; 7 to 15 characters. */
    public static final String PHONE = "^[0-9+ -]{7,15}$";

    /** Delivery handover OTP: exactly 4 digits. */
    public static final String OTP = "^\\d{4}$";

    /** Batch codes such as BATCH-001. */
    public static final String BATCH_CODE = "^[A-Za-z0-9_-]{1,40}$";

    private ValidationPatterns() {
    }
}
