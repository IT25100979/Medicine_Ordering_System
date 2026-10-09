package com.mediorder.it25100979_delivery_management.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Courier partners a customer can choose at checkout and a coordinator can assign. */
public enum CourierCompany {
    DHL("DHL", "Express international-grade handling", 1),
    KOOMBIYO("Koombiyo", "Island-wide standard delivery", 2),
    LANKA_DELIVERY("Lanka Delivery", "Budget local delivery", 2),
    IN_COMPANY_DELIVERY("In Company Delivery", "Pharmacy's own riders, cold-chain ready", 1);

    private final String displayName;
    private final String description;
    private final int estimatedDays;

    CourierCompany(String displayName, String description, int estimatedDays) {
        this.displayName = displayName;
        this.description = description;
        this.estimatedDays = estimatedDays;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public int getEstimatedDays() {
        return estimatedDays;
    }

    /** Accepts either the enum name ("LANKA_DELIVERY") or the display name ("Lanka Delivery"). */
    @JsonCreator
    public static CourierCompany fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String trimmed = value.trim();
        String normalized = trimmed.toUpperCase().replace(" ", "_");
        for (CourierCompany courier : values()) {
            if (courier.name().equals(normalized) || courier.displayName.equalsIgnoreCase(trimmed)) {
                return courier;
            }
        }
        throw new IllegalArgumentException("Unknown courier company: " + value);
    }

    public static boolean isValid(String value) {
        try {
            return fromString(value) != null;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
