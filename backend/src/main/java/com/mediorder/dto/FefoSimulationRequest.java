package com.mediorder.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class FefoSimulationRequest {

    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    @NotNull(message = "Requested quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer requestedQuantity;

    public FefoSimulationRequest() {}

    public FefoSimulationRequest(Long medicineId, Integer requestedQuantity) {
        this.medicineId = medicineId;
        this.requestedQuantity = requestedQuantity;
    }

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public Integer getRequestedQuantity() { return requestedQuantity; }
    public void setRequestedQuantity(Integer requestedQuantity) { this.requestedQuantity = requestedQuantity; }
}
