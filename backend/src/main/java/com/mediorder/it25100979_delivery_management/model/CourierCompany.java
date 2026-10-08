package com.mediorder.it25100979_delivery_management.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CourierCompany {
    DHL("DHL"),
    KOOMBIYO("Koombiyo"),
    LANKA_DELIVERY("Lanka Delivery"),
    IN_COMPANY_DELIVERY("In Company Delivery");

    private final String displayName;

    CourierCompany(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static CourierCompany fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String normalized = value.trim().toUpperCase().replace(" ", "_");
        for (CourierCompany courier : values()) {
            if (courier.name().equalsIgnoreCase(normalized) || 
                courier.displayName.equalsIgnoreCase(value.trim())) {
                return courier;
            }
        }
        // Fallback check
        for (CourierCompany courier : values()) {
            if (courier.displayName.toLowerCase().contains(value.toLowerCase())) {
                return courier;
            }
        }
        throw new IllegalArgumentException("Unknown courier company: " + value);
    }
}
