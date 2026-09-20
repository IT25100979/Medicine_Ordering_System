package com.mediorder.dto;

import java.time.LocalDate;

public class BatchAllocationPlanDto {

    private Long batchId;
    private String batchNumber;
    private LocalDate expiryDate;
    private int allocatedQuantity;
    private int remainingQuantityAfter;
    private String shelfLocation;

    public BatchAllocationPlanDto() {
    }

    public BatchAllocationPlanDto(Long batchId, String batchNumber, LocalDate expiryDate, int allocatedQuantity, int remainingQuantityAfter, String shelfLocation) {
        this.batchId = batchId;
        this.batchNumber = batchNumber;
        this.expiryDate = expiryDate;
        this.allocatedQuantity = allocatedQuantity;
        this.remainingQuantityAfter = remainingQuantityAfter;
        this.shelfLocation = shelfLocation;
    }

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public int getAllocatedQuantity() {
        return allocatedQuantity;
    }

    public void setAllocatedQuantity(int allocatedQuantity) {
        this.allocatedQuantity = allocatedQuantity;
    }

    public int getRemainingQuantityAfter() {
        return remainingQuantityAfter;
    }

    public void setRemainingQuantityAfter(int remainingQuantityAfter) {
        this.remainingQuantityAfter = remainingQuantityAfter;
    }

    public String getShelfLocation() {
        return shelfLocation;
    }

    public void setShelfLocation(String shelfLocation) {
        this.shelfLocation = shelfLocation;
    }
}
