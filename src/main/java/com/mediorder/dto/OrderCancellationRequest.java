package com.mediorder.dto;

import jakarta.validation.constraints.NotBlank;

public class OrderCancellationRequest {

    @NotBlank(message = "Cancellation reason is required")
    private String reason;

    public OrderCancellationRequest() {
    }

    public OrderCancellationRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
