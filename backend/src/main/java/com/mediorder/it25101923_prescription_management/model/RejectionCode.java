package com.mediorder.it25101923_prescription_management.model;
public enum RejectionCode {
    UNCLEAR_DOCUMENT("Document is unclear"),
    EXPIRED_PRESCRIPTION("Prescription is outdated"),
    MISSING_SIGNATURE("Doctor's signature or seal is missing"),
    INVALID_PRESCRIBER("Prescriber information cannot be verified"),
    PATIENT_MISMATCH("Patient information does not match"),
    OTHER("Other reason");
    private final String label;
    RejectionCode(String label) { this.label = label; }
    public String getLabel() { return label; }
}
