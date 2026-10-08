package com.mediorder.it25101923_prescription_management.dto;
public record PrescriptionUpdateRequest(String doctorName, String patientNotes, Boolean chronicSubscription, Long version) {}
