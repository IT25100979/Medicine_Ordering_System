package com.mediorder.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "inventory_batches")
public class InventoryBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Medicine medicine;

    @Column(name = "batch_number", nullable = false, unique = true, length = 100)
    private String batchNumber;

    @Column(name = "initial_quantity", nullable = false)
    private Integer initialQuantity = 0;

    @Column(name = "quantity_available", nullable = false)
    private Integer quantityAvailable = 0;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Column(name = "manufacturing_date", nullable = false)
    private LocalDate manufacturingDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "shelf_location", length = 80)
    private String shelfLocation;

    @Column(name = "quarantine_reason", length = 255)
    private String quarantineReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BatchStatus status = BatchStatus.ACTIVE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public InventoryBatch() {}

    public InventoryBatch(Long id, Medicine medicine, String batchNumber, Integer initialQuantity,
                          Integer quantityAvailable, Integer stockQuantity, LocalDate manufacturingDate,
                          LocalDate expiryDate, String shelfLocation, String quarantineReason,
                          BatchStatus status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.medicine = medicine;
        this.batchNumber = batchNumber;
        this.initialQuantity = initialQuantity != null ? initialQuantity : 0;
        this.quantityAvailable = quantityAvailable != null ? quantityAvailable : 0;
        this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
        this.manufacturingDate = manufacturingDate;
        this.expiryDate = expiryDate;
        this.shelfLocation = shelfLocation;
        this.quarantineReason = quarantineReason;
        this.status = status != null ? status : BatchStatus.ACTIVE;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (quantityAvailable == null) quantityAvailable = stockQuantity != null ? stockQuantity : 0;
        if (stockQuantity == null || stockQuantity == 0) stockQuantity = quantityAvailable;
        if (initialQuantity == null || initialQuantity == 0) initialQuantity = quantityAvailable;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (quantityAvailable != null) stockQuantity = quantityAvailable;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public Integer getInitialQuantity() { return initialQuantity; }
    public void setInitialQuantity(Integer initialQuantity) { this.initialQuantity = initialQuantity; }

    public Integer getQuantityAvailable() { return quantityAvailable; }
    public void setQuantityAvailable(Integer quantityAvailable) {
        this.quantityAvailable = quantityAvailable;
        this.stockQuantity = quantityAvailable;
    }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
        if (this.quantityAvailable == null || this.quantityAvailable == 0) {
            this.quantityAvailable = stockQuantity;
        }
    }

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

    public long getDaysUntilExpiry() {
        if (expiryDate == null) return 0;
        return ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);
    }

    public boolean isExpired() {
        if (expiryDate == null) return false;
        return LocalDate.now().isAfter(expiryDate);
    }

    public static InventoryBatchBuilder builder() {
        return new InventoryBatchBuilder();
    }

    public static class InventoryBatchBuilder {
        private Long id;
        private Medicine medicine;
        private String batchNumber;
        private Integer initialQuantity = 0;
        private Integer quantityAvailable = 0;
        private Integer stockQuantity = 0;
        private LocalDate manufacturingDate;
        private LocalDate expiryDate;
        private String shelfLocation;
        private String quarantineReason;
        private BatchStatus status = BatchStatus.ACTIVE;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public InventoryBatchBuilder id(Long id) { this.id = id; return this; }
        public InventoryBatchBuilder medicine(Medicine medicine) { this.medicine = medicine; return this; }
        public InventoryBatchBuilder batchNumber(String batchNumber) { this.batchNumber = batchNumber; return this; }
        public InventoryBatchBuilder initialQuantity(Integer initialQuantity) { this.initialQuantity = initialQuantity; return this; }
        public InventoryBatchBuilder quantityAvailable(Integer quantityAvailable) { this.quantityAvailable = quantityAvailable; return this; }
        public InventoryBatchBuilder stockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; return this; }
        public InventoryBatchBuilder manufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; return this; }
        public InventoryBatchBuilder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public InventoryBatchBuilder shelfLocation(String shelfLocation) { this.shelfLocation = shelfLocation; return this; }
        public InventoryBatchBuilder quarantineReason(String quarantineReason) { this.quarantineReason = quarantineReason; return this; }
        public InventoryBatchBuilder status(BatchStatus status) { this.status = status; return this; }
        public InventoryBatchBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public InventoryBatchBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public InventoryBatch build() {
            return new InventoryBatch(id, medicine, batchNumber, initialQuantity, quantityAvailable,
                    stockQuantity, manufacturingDate, expiryDate, shelfLocation, quarantineReason, status, createdAt, updatedAt);
        }
    }
}
