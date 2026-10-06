package com.mediorder.dto;

import java.time.LocalDate;

public class FefoAllocationStep {

    private int stepNumber;
    private Long batchId;
    private String batchNumber;
    private LocalDate expiryDate;
    private long daysUntilExpiry;
    private String shelfLocation;
    private Integer batchAvailableBefore;
    private Integer allocatedFromBatch;
    private Integer batchRemainingAfter;
    private String rationale;

    public FefoAllocationStep() {}

    public FefoAllocationStep(int stepNumber, Long batchId, String batchNumber, LocalDate expiryDate,
                              long daysUntilExpiry, String shelfLocation, Integer batchAvailableBefore,
                              Integer allocatedFromBatch, Integer batchRemainingAfter, String rationale) {
        this.stepNumber = stepNumber;
        this.batchId = batchId;
        this.batchNumber = batchNumber;
        this.expiryDate = expiryDate;
        this.daysUntilExpiry = daysUntilExpiry;
        this.shelfLocation = shelfLocation;
        this.batchAvailableBefore = batchAvailableBefore;
        this.allocatedFromBatch = allocatedFromBatch;
        this.batchRemainingAfter = batchRemainingAfter;
        this.rationale = rationale;
    }

    public int getStepNumber() { return stepNumber; }
    public void setStepNumber(int stepNumber) { this.stepNumber = stepNumber; }

    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public long getDaysUntilExpiry() { return daysUntilExpiry; }
    public void setDaysUntilExpiry(long daysUntilExpiry) { this.daysUntilExpiry = daysUntilExpiry; }

    public String getShelfLocation() { return shelfLocation; }
    public void setShelfLocation(String shelfLocation) { this.shelfLocation = shelfLocation; }

    public Integer getBatchAvailableBefore() { return batchAvailableBefore; }
    public void setBatchAvailableBefore(Integer batchAvailableBefore) { this.batchAvailableBefore = batchAvailableBefore; }

    public Integer getAllocatedFromBatch() { return allocatedFromBatch; }
    public void setAllocatedFromBatch(Integer allocatedFromBatch) { this.allocatedFromBatch = allocatedFromBatch; }

    public Integer getBatchRemainingAfter() { return batchRemainingAfter; }
    public void setBatchRemainingAfter(Integer batchRemainingAfter) { this.batchRemainingAfter = batchRemainingAfter; }

    public String getRationale() { return rationale; }
    public void setRationale(String rationale) { this.rationale = rationale; }

    public static FefoAllocationStepBuilder builder() {
        return new FefoAllocationStepBuilder();
    }

    public static class FefoAllocationStepBuilder {
        private int stepNumber;
        private Long batchId;
        private String batchNumber;
        private LocalDate expiryDate;
        private long daysUntilExpiry;
        private String shelfLocation;
        private Integer batchAvailableBefore;
        private Integer allocatedFromBatch;
        private Integer batchRemainingAfter;
        private String rationale;

        public FefoAllocationStepBuilder stepNumber(int stepNumber) { this.stepNumber = stepNumber; return this; }
        public FefoAllocationStepBuilder batchId(Long batchId) { this.batchId = batchId; return this; }
        public FefoAllocationStepBuilder batchNumber(String batchNumber) { this.batchNumber = batchNumber; return this; }
        public FefoAllocationStepBuilder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public FefoAllocationStepBuilder daysUntilExpiry(long daysUntilExpiry) { this.daysUntilExpiry = daysUntilExpiry; return this; }
        public FefoAllocationStepBuilder shelfLocation(String shelfLocation) { this.shelfLocation = shelfLocation; return this; }
        public FefoAllocationStepBuilder batchAvailableBefore(Integer batchAvailableBefore) { this.batchAvailableBefore = batchAvailableBefore; return this; }
        public FefoAllocationStepBuilder allocatedFromBatch(Integer allocatedFromBatch) { this.allocatedFromBatch = allocatedFromBatch; return this; }
        public FefoAllocationStepBuilder batchRemainingAfter(Integer batchRemainingAfter) { this.batchRemainingAfter = batchRemainingAfter; return this; }
        public FefoAllocationStepBuilder rationale(String rationale) { this.rationale = rationale; return this; }

        public FefoAllocationStep build() {
            return new FefoAllocationStep(stepNumber, batchId, batchNumber, expiryDate, daysUntilExpiry,
                    shelfLocation, batchAvailableBefore, allocatedFromBatch, batchRemainingAfter, rationale);
        }
    }
}
