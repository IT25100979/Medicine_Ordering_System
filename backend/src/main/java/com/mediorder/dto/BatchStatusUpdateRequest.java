package com.mediorder.dto;

import com.mediorder.model.BatchStatus;
import jakarta.validation.constraints.NotNull;

public class BatchStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private BatchStatus status;

    private String quarantineReason;

    public BatchStatusUpdateRequest() {}

    public BatchStatusUpdateRequest(BatchStatus status, String quarantineReason) {
        this.status = status;
        this.quarantineReason = quarantineReason;
    }

    public BatchStatus getStatus() { return status; }
    public void setStatus(BatchStatus status) { this.status = status; }

    public String getQuarantineReason() { return quarantineReason; }
    public void setQuarantineReason(String quarantineReason) { this.quarantineReason = quarantineReason; }
}
