package com.mediorder.it25101882_cold_chain_tagging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Data Transfer Object (DTO) for creating and updating Cold-Chain records.
 * Encapsulates input data and validation rules.
 */
public class ColdChainRequest {

    @NotBlank(message = "Order ID cannot be empty.")
    @Size(max = 50, message = "Order ID cannot exceed 50 characters.")
    private String orderId;

    @NotBlank(message = "Medication Name cannot be empty.")
    @Size(max = 100, message = "Medication Name cannot exceed 100 characters.")
    private String medicationName;

    private Boolean temperatureSensitive = true;

    private Double minTemperature;

    private Double maxTemperature;

    @NotNull(message = "Current Temperature is required and must be a numeric value.")
    private Double currentTemperature;

    private Boolean ageVerificationRequired = false;

    @Positive(message = "Minimum Recipient Age must be a positive integer.")
    private Integer minimumAge;

    @NotBlank(message = "Courier Name cannot be empty.")
    @Size(max = 100, message = "Courier Name cannot exceed 100 characters.")
    private String courierName;

    @Size(max = 100, message = "Package Type cannot exceed 100 characters.")
    private String packageType;

    @NotBlank(message = "Delivery Status cannot be empty.")
    @Size(max = 50, message = "Delivery Status cannot exceed 50 characters.")
    private String deliveryStatus;

    @Size(max = 30, message = "Age Verification Status cannot exceed 30 characters.")
    private String ageVerificationStatus;

    @Size(max = 30, message = "Temperature Status cannot exceed 30 characters.")
    private String temperatureStatus;

    @Size(max = 255, message = "Notes cannot exceed 255 characters.")
    private String notes;

    public ColdChainRequest() {
    }

    public ColdChainRequest(String orderId, String medicationName, Boolean temperatureSensitive,
                            Double minTemperature, Double maxTemperature, Double currentTemperature,
                            Boolean ageVerificationRequired, Integer minimumAge, String courierName,
                            String packageType, String deliveryStatus, String ageVerificationStatus,
                            String temperatureStatus, String notes) {
        this.orderId = orderId;
        this.medicationName = medicationName;
        this.temperatureSensitive = temperatureSensitive;
        this.minTemperature = minTemperature;
        this.maxTemperature = maxTemperature;
        this.currentTemperature = currentTemperature;
        this.ageVerificationRequired = ageVerificationRequired;
        this.minimumAge = minimumAge;
        this.courierName = courierName;
        this.packageType = packageType;
        this.deliveryStatus = deliveryStatus;
        this.ageVerificationStatus = ageVerificationStatus;
        this.temperatureStatus = temperatureStatus;
        this.notes = notes;
    }

    // Getters and Setters
    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getMedicationName() {
        return medicationName;
    }

    public void setMedicationName(String medicationName) {
        this.medicationName = medicationName;
    }

    public Boolean getTemperatureSensitive() {
        return temperatureSensitive != null ? temperatureSensitive : false;
    }

    public void setTemperatureSensitive(Boolean temperatureSensitive) {
        this.temperatureSensitive = temperatureSensitive;
    }

    public Double getMinTemperature() {
        return minTemperature;
    }

    public void setMinTemperature(Double minTemperature) {
        this.minTemperature = minTemperature;
    }

    public Double getMaxTemperature() {
        return maxTemperature;
    }

    public void setMaxTemperature(Double maxTemperature) {
        this.maxTemperature = maxTemperature;
    }

    public Double getCurrentTemperature() {
        return currentTemperature;
    }

    public void setCurrentTemperature(Double currentTemperature) {
        this.currentTemperature = currentTemperature;
    }

    public Boolean getAgeVerificationRequired() {
        return ageVerificationRequired != null ? ageVerificationRequired : false;
    }

    public void setAgeVerificationRequired(Boolean ageVerificationRequired) {
        this.ageVerificationRequired = ageVerificationRequired;
    }

    public Integer getMinimumAge() {
        return minimumAge;
    }

    public void setMinimumAge(Integer minimumAge) {
        this.minimumAge = minimumAge;
    }

    public String getCourierName() {
        return courierName;
    }

    public void setCourierName(String courierName) {
        this.courierName = courierName;
    }

    public String getPackageType() {
        return packageType;
    }

    public void setPackageType(String packageType) {
        this.packageType = packageType;
    }

    public String getDeliveryStatus() {
        return deliveryStatus;
    }

    public void setDeliveryStatus(String deliveryStatus) {
        this.deliveryStatus = deliveryStatus;
    }

    public String getAgeVerificationStatus() {
        return ageVerificationStatus;
    }

    public void setAgeVerificationStatus(String ageVerificationStatus) {
        this.ageVerificationStatus = ageVerificationStatus;
    }

    public String getTemperatureStatus() {
        return temperatureStatus;
    }

    public void setTemperatureStatus(String temperatureStatus) {
        this.temperatureStatus = temperatureStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String orderId;
        private String medicationName;
        private Boolean temperatureSensitive = true;
        private Double minTemperature;
        private Double maxTemperature;
        private Double currentTemperature;
        private Boolean ageVerificationRequired = false;
        private Integer minimumAge;
        private String courierName;
        private String packageType;
        private String deliveryStatus;
        private String ageVerificationStatus;
        private String temperatureStatus;
        private String notes;

        public Builder orderId(String orderId) { this.orderId = orderId; return this; }
        public Builder medicationName(String medicationName) { this.medicationName = medicationName; return this; }
        public Builder temperatureSensitive(Boolean temperatureSensitive) { this.temperatureSensitive = temperatureSensitive; return this; }
        public Builder minTemperature(Double minTemperature) { this.minTemperature = minTemperature; return this; }
        public Builder maxTemperature(Double maxTemperature) { this.maxTemperature = maxTemperature; return this; }
        public Builder currentTemperature(Double currentTemperature) { this.currentTemperature = currentTemperature; return this; }
        public Builder ageVerificationRequired(Boolean ageVerificationRequired) { this.ageVerificationRequired = ageVerificationRequired; return this; }
        public Builder minimumAge(Integer minimumAge) { this.minimumAge = minimumAge; return this; }
        public Builder courierName(String courierName) { this.courierName = courierName; return this; }
        public Builder packageType(String packageType) { this.packageType = packageType; return this; }
        public Builder deliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; return this; }
        public Builder ageVerificationStatus(String ageVerificationStatus) { this.ageVerificationStatus = ageVerificationStatus; return this; }
        public Builder temperatureStatus(String temperatureStatus) { this.temperatureStatus = temperatureStatus; return this; }
        public Builder notes(String notes) { this.notes = notes; return this; }

        public ColdChainRequest build() {
            return new ColdChainRequest(orderId, medicationName, temperatureSensitive, minTemperature,
                    maxTemperature, currentTemperature, ageVerificationRequired, minimumAge, courierName,
                    packageType, deliveryStatus, ageVerificationStatus, temperatureStatus, notes);
        }
    }
}
