package com.mediorder.model;

public enum OrderStatus {
    CLINICAL_REVIEW,
    PACKED,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED,

    // Legacy statuses for backward compatibility
    PLACED,
    VERIFIED
}
