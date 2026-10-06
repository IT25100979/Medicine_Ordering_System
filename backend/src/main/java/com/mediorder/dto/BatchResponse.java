package com.mediorder.dto;

import com.mediorder.model.BatchStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class BatchResponse {

    private Long id;
    private Long medicineId;
    private String medicineName;
    private String genericName;
    private String sku;
    private String category;
    private BigDecimal unitPrice;
    private Boolean isTemperatureSensitive;

    private String batchNumber;
    private Integer initialQuantity;
    private Integer quantityAvailable;
    private Integer stockQuantity;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String shelfLocation;
    private String quarantineReason;
    private BatchStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private long daysUntilExpiry;
    private boolean isExpired;
    private String urgencyLevel;
    private Integer fefoRank;

    public BatchResponse() {}

    public BatchResponse(Long id, Long medicineId, String medicineName, String genericName, String sku,
                         String category, BigDecimal unitPrice, Boolean isTemperatureSensitive,
                         String batchNumber, Integer initialQuantity, Integer quantityAvailable,
                         Integer stockQuantity, LocalDate manufacturingDate, LocalDate expiryDate,
                         String shelfLocation, String quarantineReason, BatchStatus status,
                         LocalDateTime createdAt, LocalDateTime updatedAt, long daysUntilExpiry,
                         boolean isExpired, String urgencyLevel, Integer fefoRank) {
        this.id = id;
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.genericName = genericName;
        this.sku = sku;
        this.category = category;
        this.unitPrice = unitPrice;
        this.isTemperatureSensitive = isTemperatureSensitive;
        this.batchNumber = batchNumber;
        this.initialQuantity = initialQuantity;
        this.quantityAvailable = quantityAvailable;
        this.stockQuantity = stockQuantity;
        this.manufacturingDate = manufacturingDate;
        this.expiryDate = expiryDate;
        this.shelfLocation = shelfLocation;
        this.quarantineReason = quarantineReason;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.daysUntilExpiry = daysUntilExpiry;
        this.isExpired = isExpired;
        this.urgencyLevel = urgencyLevel;
        this.fefoRank = fefoRank;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public Boolean getIsTemperatureSensitive() { return isTemperatureSensitive; }
    public void setIsTemperatureSensitive(Boolean isTemperatureSensitive) { this.isTemperatureSensitive = isTemperatureSensitive; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public Integer getInitialQuantity() { return initialQuantity; }
    public void setInitialQuantity(Integer initialQuantity) { this.initialQuantity = initialQuantity; }

    public Integer getQuantityAvailable() { return quantityAvailable; }
    public void setQuantityAvailable(Integer quantityAvailable) { this.quantityAvailable = quantityAvailable; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public long getDaysUntilExpiry() { return daysUntilExpiry; }
    public void setDaysUntilExpiry(long daysUntilExpiry) { this.daysUntilExpiry = daysUntilExpiry; }

    public boolean isExpired() { return isExpired; }
    public void setExpired(boolean expired) { isExpired = expired; }

    public String getUrgencyLevel() { return urgencyLevel; }
    public void setUrgencyLevel(String urgencyLevel) { this.urgencyLevel = urgencyLevel; }

    public Integer getFefoRank() { return fefoRank; }
    public void setFefoRank(Integer fefoRank) { this.fefoRank = fefoRank; }

    public static BatchResponseBuilder builder() {
        return new BatchResponseBuilder();
    }

    public static class BatchResponseBuilder {
        private Long id;
        private Long medicineId;
        private String medicineName;
        private String genericName;
        private String sku;
        private String category;
        private BigDecimal unitPrice;
        private Boolean isTemperatureSensitive;
        private String batchNumber;
        private Integer initialQuantity;
        private Integer quantityAvailable;
        private Integer stockQuantity;
        private LocalDate manufacturingDate;
        private LocalDate expiryDate;
        private String shelfLocation;
        private String quarantineReason;
        private BatchStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private long daysUntilExpiry;
        private boolean isExpired;
        private String urgencyLevel;
        private Integer fefoRank;

        public BatchResponseBuilder id(Long id) { this.id = id; return this; }
        public BatchResponseBuilder medicineId(Long medicineId) { this.medicineId = medicineId; return this; }
        public BatchResponseBuilder medicineName(String medicineName) { this.medicineName = medicineName; return this; }
        public BatchResponseBuilder genericName(String genericName) { this.genericName = genericName; return this; }
        public BatchResponseBuilder sku(String sku) { this.sku = sku; return this; }
        public BatchResponseBuilder category(String category) { this.category = category; return this; }
        public BatchResponseBuilder unitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; return this; }
        public BatchResponseBuilder isTemperatureSensitive(Boolean isTemperatureSensitive) { this.isTemperatureSensitive = isTemperatureSensitive; return this; }
        public BatchResponseBuilder batchNumber(String batchNumber) { this.batchNumber = batchNumber; return this; }
        public BatchResponseBuilder initialQuantity(Integer initialQuantity) { this.initialQuantity = initialQuantity; return this; }
        public BatchResponseBuilder quantityAvailable(Integer quantityAvailable) { this.quantityAvailable = quantityAvailable; return this; }
        public BatchResponseBuilder stockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; return this; }
        public BatchResponseBuilder manufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; return this; }
        public BatchResponseBuilder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public BatchResponseBuilder shelfLocation(String shelfLocation) { this.shelfLocation = shelfLocation; return this; }
        public BatchResponseBuilder quarantineReason(String quarantineReason) { this.quarantineReason = quarantineReason; return this; }
        public BatchResponseBuilder status(BatchStatus status) { this.status = status; return this; }
        public BatchResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public BatchResponseBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public BatchResponseBuilder daysUntilExpiry(long daysUntilExpiry) { this.daysUntilExpiry = daysUntilExpiry; return this; }
        public BatchResponseBuilder isExpired(boolean isExpired) { this.isExpired = isExpired; return this; }
        public BatchResponseBuilder urgencyLevel(String urgencyLevel) { this.urgencyLevel = urgencyLevel; return this; }
        public BatchResponseBuilder fefoRank(Integer fefoRank) { this.fefoRank = fefoRank; return this; }

        public BatchResponse build() {
            return new BatchResponse(id, medicineId, medicineName, genericName, sku, category, unitPrice,
                    isTemperatureSensitive, batchNumber, initialQuantity, quantityAvailable, stockQuantity,
                    manufacturingDate, expiryDate, shelfLocation, quarantineReason, status, createdAt,
                    updatedAt, daysUntilExpiry, isExpired, urgencyLevel, fefoRank);
        }
    }
}
