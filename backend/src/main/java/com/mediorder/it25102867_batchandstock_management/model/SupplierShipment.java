package com.mediorder.it25102867_batchandstock_management.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "supplier_shipments", indexes = {
    @Index(name = "idx_shipment_ref", columnList = "reference_no", unique = true),
    @Index(name = "idx_shipment_status", columnList = "status")
})
public class SupplierShipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "reference_no", nullable = false, unique = true, length = 100)
    private String referenceNo;

    @Column(name = "received_date", nullable = false)
    private LocalDate receivedDate;

    @Column(name = "received_by", length = 150)
    private String receivedBy;

    @Column(nullable = false, length = 50)
    private String status = "RECEIVED"; // RECEIVED, QC_IN_PROGRESS, PROCESSED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public SupplierShipment() {}

    public SupplierShipment(Long id, Supplier supplier, String referenceNo, LocalDate receivedDate,
                            String receivedBy, String status, String notes, LocalDateTime createdAt) {
        this.id = id;
        this.supplier = supplier;
        this.referenceNo = referenceNo;
        this.receivedDate = receivedDate != null ? receivedDate : LocalDate.now();
        this.receivedBy = receivedBy;
        this.status = status != null ? status : "RECEIVED";
        this.notes = notes;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "RECEIVED";
        }
        if (this.receivedDate == null) {
            this.receivedDate = LocalDate.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }
    public String getReferenceNo() { return referenceNo; }
    public void setReferenceNo(String referenceNo) { this.referenceNo = referenceNo; }
    public LocalDate getReceivedDate() { return receivedDate; }
    public void setReceivedDate(LocalDate receivedDate) { this.receivedDate = receivedDate; }
    public String getReceivedBy() { return receivedBy; }
    public void setReceivedBy(String receivedBy) { this.receivedBy = receivedBy; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static SupplierShipmentBuilder builder() {
        return new SupplierShipmentBuilder();
    }

    public static class SupplierShipmentBuilder {
        private Long id;
        private Supplier supplier;
        private String referenceNo;
        private LocalDate receivedDate;
        private String receivedBy;
        private String status = "RECEIVED";
        private String notes;
        private LocalDateTime createdAt;

        public SupplierShipmentBuilder id(Long id) { this.id = id; return this; }
        public SupplierShipmentBuilder supplier(Supplier supplier) { this.supplier = supplier; return this; }
        public SupplierShipmentBuilder referenceNo(String referenceNo) { this.referenceNo = referenceNo; return this; }
        public SupplierShipmentBuilder receivedDate(LocalDate receivedDate) { this.receivedDate = receivedDate; return this; }
        public SupplierShipmentBuilder receivedBy(String receivedBy) { this.receivedBy = receivedBy; return this; }
        public SupplierShipmentBuilder status(String status) { this.status = status; return this; }
        public SupplierShipmentBuilder notes(String notes) { this.notes = notes; return this; }
        public SupplierShipmentBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public SupplierShipment build() {
            return new SupplierShipment(id, supplier, referenceNo, receivedDate, receivedBy, status, notes, createdAt);
        }
    }
}
