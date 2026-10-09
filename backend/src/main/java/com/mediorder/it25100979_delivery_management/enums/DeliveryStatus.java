package com.mediorder.it25100979_delivery_management.enums;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/**
 * Delivery lifecycle and the transitions allowed between states.
 *
 * <pre>
 * Customer confirms order + courier partner
 *        |
 *     PENDING  --reject-->  REJECTED
 *        | approve (Delivery Coordinator)
 *     APPROVED
 *        | assign courier
 *     DISPATCHED  --(courier)-->  IN_TRANSIT  --OTP ok-->  DELIVERED
 *        |                             |
 *        +---------> FAILED <----------+      (FAILED can be re-dispatched)
 *
 * PENDING / APPROVED / DISPATCHED can also be put ON_HOLD, POSTPONED or TERMINATED.
 * ON_HOLD / POSTPONED resume back to PENDING (or APPROVED if it was already approved).
 * </pre>
 */
public enum DeliveryStatus {
    PENDING("Awaiting approval"),
    APPROVED("Approved, awaiting courier"),
    REJECTED("Rejected"),
    DISPATCHED("Courier assigned"),
    IN_TRANSIT("Out for delivery"),
    DELIVERED("Delivered"),
    FAILED("Delivery failed"),
    ON_HOLD("On hold"),
    POSTPONED("Postponed"),
    TERMINATED("Terminated");

    private final String label;
    private Set<DeliveryStatus> allowedNext = Collections.emptySet();

    static {
        PENDING.allowedNext = EnumSet.of(APPROVED, DISPATCHED, REJECTED, ON_HOLD, POSTPONED, TERMINATED);
        APPROVED.allowedNext = EnumSet.of(DISPATCHED, ON_HOLD, POSTPONED, TERMINATED);
        DISPATCHED.allowedNext = EnumSet.of(DISPATCHED, IN_TRANSIT, DELIVERED, FAILED, ON_HOLD, POSTPONED, TERMINATED);
        IN_TRANSIT.allowedNext = EnumSet.of(DELIVERED, FAILED);
        FAILED.allowedNext = EnumSet.of(DISPATCHED, TERMINATED);
        ON_HOLD.allowedNext = EnumSet.of(PENDING, APPROVED, TERMINATED);
        POSTPONED.allowedNext = EnumSet.of(PENDING, APPROVED, TERMINATED);
        // REJECTED, DELIVERED and TERMINATED are final states.
    }

    DeliveryStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public boolean canTransitionTo(DeliveryStatus target) {
        return allowedNext.contains(target);
    }

    public boolean isFinal() {
        return allowedNext.isEmpty();
    }

    /** Parser for values stored as strings in the database / sent by clients. */
    public static DeliveryStatus from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Delivery status value cannot be null or empty");
        }
        String normalized = value.trim().toUpperCase();
        if ("UNSUCCESSFUL".equals(normalized)) {
            return FAILED;
        }
        if ("CANCELLED".equals(normalized) || "CANCELED".equals(normalized)) {
            return TERMINATED;
        }
        try {
            return DeliveryStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown delivery status: " + value);
        }
    }
}
