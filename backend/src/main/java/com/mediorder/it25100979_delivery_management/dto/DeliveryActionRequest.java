package com.mediorder.it25100979_delivery_management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DeliveryActionRequest {
    @JsonProperty("action")
    private String action;

    @JsonProperty("reason")
    private String reason;

    public DeliveryActionRequest() {}

    public DeliveryActionRequest(String action, String reason) {
        this.action = action;
        this.reason = reason;
    }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
