package com.mediorder.it25101882_cold_chain_tagging.model;

public enum ColdChainSection {
    AMBIENT("Ambient Room Temp (15°C - 25°C)"),
    COOL_ROOM("Cool Room (15°C - 25°C Specialized)"),
    REFRIGERATED("Refrigerated (2°C - 8°C)"),
    FROZEN("Frozen (< 0°C)"),
    CONTROLLED_VAULT("Controlled / Secured Vault");

    private final String description;

    ColdChainSection(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
