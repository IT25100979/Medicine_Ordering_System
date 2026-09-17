package com.mediorder.dto;

import java.util.ArrayList;
import java.util.List;

public class FefoAllocationPreviewResponse {

    private Long medicineId;
    private String medicineName;
    private int requestedQuantity;
    private int allocatedQuantity;
    private boolean fullyFulfilled;
    private int shortage;
    private List<BatchAllocationPlanDto> allocationPlan = new ArrayList<>();
    private List<String> exclusionNotes = new ArrayList<>();

    public FefoAllocationPreviewResponse() {
    }

    public Long getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Long medicineId) {
        this.medicineId = medicineId;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public int getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(int requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public int getAllocatedQuantity() {
        return allocatedQuantity;
    }

    public void setAllocatedQuantity(int allocatedQuantity) {
        this.allocatedQuantity = allocatedQuantity;
    }

    public boolean isFullyFulfilled() {
        return fullyFulfilled;
    }

    public void setFullyFulfilled(boolean fullyFulfilled) {
        this.fullyFulfilled = fullyFulfilled;
    }

    public int getShortage() {
        return shortage;
    }

    public void setShortage(int shortage) {
        this.shortage = shortage;
    }

    public List<BatchAllocationPlanDto> getAllocationPlan() {
        return allocationPlan;
    }

    public void setAllocationPlan(List<BatchAllocationPlanDto> allocationPlan) {
        this.allocationPlan = allocationPlan;
    }

    public List<String> getExclusionNotes() {
        return exclusionNotes;
    }

    public void setExclusionNotes(List<String> exclusionNotes) {
        this.exclusionNotes = exclusionNotes;
    }
}
