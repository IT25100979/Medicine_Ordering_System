package com.mediorder.it25100979_delivery_management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CourierStatusUpdateRequest {
    @JsonProperty("status")
    private String status;

    @JsonProperty("otp")
    private String otp;

    @JsonProperty("failureReason")
    private String failureReason;

    public CourierStatusUpdateRequest() {}

    public CourierStatusUpdateRequest(String status, String otp, String failureReason) {
        this.status = status;
        this.otp = otp;
        this.failureReason = failureReason;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
}
