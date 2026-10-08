package com.mediorder.it25102867_batchandstock_management.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_batches", indexes = {
    @Index(name = "idx_batch_medicine", columnList = "medicine_id"),
    @Index(name = "idx_batch_number", columnList = "batch_number", unique = true),
    @Index(name = "idx_batch_expiry", columnList = "expiry_date"),
    @Index(name = "idx_batch_status", columnList = "status")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InventoryBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id")
    private SupplierShipment supplierShipment;

    @Column(name = "batch_number", nullable = false, unique = true, length = 100)
    private String batchNumber;

    @Column(name = "qty_received")
    private Integer qtyReceived = 0;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Column(name = "qty_reserved")
    private Integer qtyReserved = 0;

    @Column(name = "arrived_date")
    private LocalDate arrivedDate;

    @Column(name = "manufacturing_date", nullable = false)
    private LocalDate manufacturingDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BatchStatus status = BatchStatus.LIVE;

    @Column(name = "qc_notes", columnDefinition = "TEXT")
    private String qcNotes;

    @Column(name = "qc_passed_by", length = 150)
    private String qcPassedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public InventoryBatch() {}

    public InventoryBatch(Long id, Medicine medicine, SupplierShipment supplierShipment, String batchNumber,
                          Integer qtyReceived, Integer stockQuantity, Integer qtyReserved,
                          LocalDate arrivedDate, LocalDate manufacturingDate, LocalDate expiryDate,
                          BatchStatus status, String qcNotes, String qcPassedBy, LocalDateTime createdAt) {
        this.id = id;
        this.medicine = medicine;
        this.supplierShipment = supplierShipment;
        this.batchNumber = batchNumber;
        this.qtyReceived = qtyReceived != null ? qtyReceived : (stockQuantity != null ? stockQuantity : 0);
        this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
        this.qtyReserved = qtyReserved != null ? qtyReserved : 0;
        this.arrivedDate = arrivedDate != null ? arrivedDate : LocalDate.now();
        this.manufacturingDate = manufacturingDate;
        this.expiryDate = expiryDate;
        this.status = status != null ? status : BatchStatus.LIVE;
        this.qcNotes = qcNotes;
        this.qcPassedBy = qcPassedBy;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = BatchStatus.LIVE;
        }
        if (this.arrivedDate == null) {
            this.arrivedDate = LocalDate.now();
        }
        if (this.qtyReceived == null || this.qtyReceived == 0) {
            this.qtyReceived = this.stockQuantity != null ? this.stockQuantity : 0;
        }
        if (this.qtyReserved == null) {
            this.qtyReserved = 0;
        }
    }

    public Integer getQtyAvailable() {
        int total = stockQuantity != null ? stockQuantity : 0;
        int reserved = qtyReserved != null ? qtyReserved : 0;
        return Math.max(0, total - reserved);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }
    public SupplierShipment getSupplierShipment() { return supplierShipment; }
    public void setSupplierShipment(SupplierShipment supplierShipment) { this.supplierShipment = supplierShipment; }
    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
    public Integer getQtyReceived() { return qtyReceived != null ? qtyReceived : 0; }
    public void setQtyReceived(Integer qtyReceived) { this.qtyReceived = qtyReceived; }
    public Integer getStockQuantity() { return stockQuantity != null ? stockQuantity : 0; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
    public Integer getQtyReserved() { return qtyReserved != null ? qtyReserved : 0; }
    public void setQtyReserved(Integer qtyReserved) { this.qtyReserved = qtyReserved; }
    public LocalDate getArrivedDate() { return arrivedDate; }
    public void setArrivedDate(LocalDate arrivedDate) { this.arrivedDate = arrivedDate; }
    public LocalDate getManufacturingDate() { return manufacturingDate; }
    public void setManufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    public BatchStatus getStatus() { return status; }
    public void setStatus(BatchStatus status) { this.status = status; }
    public String getQcNotes() { return qcNotes; }
    public void setQcNotes(String qcNotes) { this.qcNotes = qcNotes; }
    public String getQcPassedBy() { return qcPassedBy; }
    public void setQcPassedBy(String qcPassedBy) { this.qcPassedBy = qcPassedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static InventoryBatchBuilder builder() {
        return new InventoryBatchBuilder();
    }

    public static class InventoryBatchBuilder {
        private Long id;
        private Medicine medicine;
        private SupplierShipment supplierShipment;
        private String batchNumber;
        private Integer qtyReceived = 0;
        private Integer stockQuantity = 0;
        private Integer qtyReserved = 0;
        private LocalDate arrivedDate;
        private LocalDate manufacturingDate;
        private LocalDate expiryDate;
        private BatchStatus status = BatchStatus.LIVE;
        private String qcNotes;
        private String qcPassedBy;
        private LocalDateTime createdAt;

        public InventoryBatchBuilder id(Long id) { this.id = id; return this; }
        public InventoryBatchBuilder medicine(Medicine medicine) { this.medicine = medicine; return this; }
        public InventoryBatchBuilder supplierShipment(SupplierShipment supplierShipment) { this.supplierShipment = supplierShipment; return this; }
        public InventoryBatchBuilder batchNumber(String batchNumber) { this.batchNumber = batchNumber; return this; }
        public InventoryBatchBuilder qtyReceived(Integer qtyReceived) { this.qtyReceived = qtyReceived; return this; }
        public InventoryBatchBuilder stockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; return this; }
        public InventoryBatchBuilder qtyReserved(Integer qtyReserved) { this.qtyReserved = qtyReserved; return this; }
        public InventoryBatchBuilder arrivedDate(LocalDate arrivedDate) { this.arrivedDate = arrivedDate; return this; }
        public InventoryBatchBuilder manufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; return this; }
        public InventoryBatchBuilder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public InventoryBatchBuilder status(BatchStatus status) { this.status = status; return this; }
        public InventoryBatchBuilder qcNotes(String qcNotes) { this.qcNotes = qcNotes; return this; }
        public InventoryBatchBuilder qcPassedBy(String qcPassedBy) { this.qcPassedBy = qcPassedBy; return this; }
        public InventoryBatchBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public InventoryBatch build() {
            return new InventoryBatch(id, medicine, supplierShipment, batchNumber, qtyReceived, stockQuantity,
                    qtyReserved, arrivedDate, manufacturingDate, expiryDate, status, qcNotes, qcPassedBy, createdAt);
        }
    }
}
