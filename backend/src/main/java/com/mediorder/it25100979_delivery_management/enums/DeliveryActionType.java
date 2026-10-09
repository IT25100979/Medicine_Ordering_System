package com.mediorder.it25100979_delivery_management.enums;

/** Administrative actions a Delivery Coordinator can apply outside the normal flow. */
public enum DeliveryActionType {
    HOLD(DeliveryStatus.ON_HOLD),
    POSTPONE(DeliveryStatus.POSTPONED),
    TERMINATE(DeliveryStatus.TERMINATED),
    /** Resume a held/postponed delivery; the target status is decided by the service. */
    RESUME(null);

    private final DeliveryStatus targetStatus;

    DeliveryActionType(DeliveryStatus targetStatus) {
        this.targetStatus = targetStatus;
    }

    public DeliveryStatus getTargetStatus() {
        return targetStatus;
    }

    public static DeliveryActionType from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Action must be provided (HOLD, POSTPONE, TERMINATE, RESUME)");
        }
        try {
            return DeliveryActionType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Unsupported action: " + value + ". Supported actions: HOLD, POSTPONE, TERMINATE, RESUME");
        }
    }
}
