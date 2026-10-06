package com.mediorder.dto;

import java.util.List;

public class FefoSimulationResponse {

    private Long medicineId;
    private String medicineName;
    private String sku;
    private Integer requestedQuantity;
    private Integer totalFulfilledQuantity;
    private Integer unfulfilledQuantity;
    private boolean fullyFulfilled;
    private String dispatchStrategy;
    private List<FefoAllocationStep> steps;
    private String message;

    public FefoSimulationResponse() {}

    public FefoSimulationResponse(Long medicineId, String medicineName, String sku, Integer requestedQuantity,
                                  Integer totalFulfilledQuantity, Integer unfulfilledQuantity,
                                  boolean fullyFulfilled, String dispatchStrategy,
                                  List<FefoAllocationStep> steps, String message) {
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.sku = sku;
        this.requestedQuantity = requestedQuantity;
        this.totalFulfilledQuantity = totalFulfilledQuantity;
        this.unfulfilledQuantity = unfulfilledQuantity;
        this.fullyFulfilled = fullyFulfilled;
        this.dispatchStrategy = dispatchStrategy;
        this.steps = steps;
        this.message = message;
    }

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public Integer getRequestedQuantity() { return requestedQuantity; }
    public void setRequestedQuantity(Integer requestedQuantity) { this.requestedQuantity = requestedQuantity; }

    public Integer getTotalFulfilledQuantity() { return totalFulfilledQuantity; }
    public void setTotalFulfilledQuantity(Integer totalFulfilledQuantity) { this.totalFulfilledQuantity = totalFulfilledQuantity; }

    public Integer getUnfulfilledQuantity() { return unfulfilledQuantity; }
    public void setUnfulfilledQuantity(Integer unfulfilledQuantity) { this.unfulfilledQuantity = unfulfilledQuantity; }

    public boolean isFullyFulfilled() { return fullyFulfilled; }
    public void setFullyFulfilled(boolean fullyFulfilled) { this.fullyFulfilled = fullyFulfilled; }

    public String getDispatchStrategy() { return dispatchStrategy; }
    public void setDispatchStrategy(String dispatchStrategy) { this.dispatchStrategy = dispatchStrategy; }

    public List<FefoAllocationStep> getSteps() { return steps; }
    public void setSteps(List<FefoAllocationStep> steps) { this.steps = steps; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public static FefoSimulationResponseBuilder builder() {
        return new FefoSimulationResponseBuilder();
    }

    public static class FefoSimulationResponseBuilder {
        private Long medicineId;
        private String medicineName;
        private String sku;
        private Integer requestedQuantity;
        private Integer totalFulfilledQuantity;
        private Integer unfulfilledQuantity;
        private boolean fullyFulfilled;
        private String dispatchStrategy;
        private List<FefoAllocationStep> steps;
        private String message;

        public FefoSimulationResponseBuilder medicineId(Long medicineId) { this.medicineId = medicineId; return this; }
        public FefoSimulationResponseBuilder medicineName(String medicineName) { this.medicineName = medicineName; return this; }
        public FefoSimulationResponseBuilder sku(String sku) { this.sku = sku; return this; }
        public FefoSimulationResponseBuilder requestedQuantity(Integer requestedQuantity) { this.requestedQuantity = requestedQuantity; return this; }
        public FefoSimulationResponseBuilder totalFulfilledQuantity(Integer totalFulfilledQuantity) { this.totalFulfilledQuantity = totalFulfilledQuantity; return this; }
        public FefoSimulationResponseBuilder unfulfilledQuantity(Integer unfulfilledQuantity) { this.unfulfilledQuantity = unfulfilledQuantity; return this; }
        public FefoSimulationResponseBuilder fullyFulfilled(boolean fullyFulfilled) { this.fullyFulfilled = fullyFulfilled; return this; }
        public FefoSimulationResponseBuilder dispatchStrategy(String dispatchStrategy) { this.dispatchStrategy = dispatchStrategy; return this; }
        public FefoSimulationResponseBuilder steps(List<FefoAllocationStep> steps) { this.steps = steps; return this; }
        public FefoSimulationResponseBuilder message(String message) { this.message = message; return this; }

        public FefoSimulationResponse build() {
            return new FefoSimulationResponse(medicineId, medicineName, sku, requestedQuantity,
                    totalFulfilledQuantity, unfulfilledQuantity, fullyFulfilled, dispatchStrategy, steps, message);
        }
    }
}
