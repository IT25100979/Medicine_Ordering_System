package com.mediorder.it25101882_cold_chain_tagging.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a Cold-Chain & Age-Verification Security Record.
 * Maps directly to MySQL table 'cold_chain_deliveries'.
 */
@Entity
@Table(name = "cold_chain_deliveries")
public class ColdChainDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;

    @Column(name = "medication_name", nullable = false, length = 100)
    private String medicationName;

    @Column(name = "temperature_sensitive", nullable = false)
    private Boolean temperatureSensitive = true;

    @Column(name = "min_temperature")
    private Double minTemperature;

    @Column(name = "max_temperature")
    private Double maxTemperature;

    @Column(name = "current_temperature", nullable = false)
    private Double currentTemperature;

    @Column(name = "age_verification_required", nullable = false)
    private Boolean ageVerificationRequired = false;

    @Column(name = "minimum_age")
    private Integer minimumAge;

    @Column(name = "courier_name", nullable = false, length = 100)
    private String courierName;

    @Column(name = "package_type", length = 100)
    private String packageType;

    @Column(name = "delivery_status", nullable = false, length = 50)
    private String deliveryStatus;

    @Column(name = "age_verification_status", length = 30)
    private String ageVerificationStatus;

    @Column(name = "temperature_status", length = 30)
    private String temperatureStatus;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public ColdChainDelivery() {
    }

    public ColdChainDelivery(Long id, String orderId, String medicationName, Boolean temperatureSensitive,
                              Double minTemperature, Double maxTemperature, Double currentTemperature,
                              Boolean ageVerificationRequired, Integer minimumAge, String courierName,
                              String packageType, String deliveryStatus, String ageVerificationStatus,
                              String temperatureStatus, String notes, LocalDateTime createdAt) {
        this.id = id;
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
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
        return temperatureSensitive;
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
        return ageVerificationRequired;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Static Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
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
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
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
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public ColdChainDelivery build() {
            return new ColdChainDelivery(id, orderId, medicationName, temperatureSensitive, minTemperature,
                    maxTemperature, currentTemperature, ageVerificationRequired, minimumAge, courierName,
                    packageType, deliveryStatus, ageVerificationStatus, temperatureStatus, notes, createdAt);
        }
    }
}
