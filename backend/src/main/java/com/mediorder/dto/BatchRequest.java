package com.mediorder.dto;

import com.mediorder.model.BatchStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class BatchRequest {

    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    @NotBlank(message = "Batch number is required")
    private String batchNumber;

    @NotNull(message = "Initial quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer initialQuantity;

    @NotNull(message = "Manufacturing date is required")
    private LocalDate manufacturingDate;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    private String shelfLocation;
    private String quarantineReason;
    private BatchStatus status = BatchStatus.ACTIVE;

    public BatchRequest() {}

    public BatchRequest(Long medicineId, String batchNumber, Integer initialQuantity,
                        LocalDate manufacturingDate, LocalDate expiryDate, String shelfLocation,
                        String quarantineReason, BatchStatus status) {
        this.medicineId = medicineId;
        this.batchNumber = batchNumber;
        this.initialQuantity = initialQuantity;
        this.manufacturingDate = manufacturingDate;
        this.expiryDate = expiryDate;
        this.shelfLocation = shelfLocation;
        this.quarantineReason = quarantineReason;
        this.status = status != null ? status : BatchStatus.ACTIVE;
    }

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public Integer getInitialQuantity() { return initialQuantity; }
    public void setInitialQuantity(Integer initialQuantity) { this.initialQuantity = initialQuantity; }

    public LocalDate getManufacturingDate() { return manufacturingDate; }
    public void setManufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getShelfLocation() { return shelfLocation; }
    public void setShelfLocation(String shelfLocation) { this.shelfLocation = shelfLocation; }

    public String getQuarantineReason() { return quarantineReason; }
    public void setQuarantineReason(String quarantineReason) { this.quarantineReason = quarantineReason; }

    public BatchStatus getStatus() { return status; }
    public void setStatus(BatchStatus status) { this.status = status; }
}
