package com.mediorder.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_batches", indexes = {
    @Index(name = "idx_batch_medicine_expiry", columnList = "medicine_id, expiry_date, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @Column(name = "manufacturing_date", nullable = false)
    private LocalDate manufactureDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "quantity_available", nullable = false)
    @Builder.Default
    private int quantityAvailable = 0;

    @Column(name = "initial_quantity", nullable = false)
    @Builder.Default
    private int initialQuantity = 0;

    @Column(name = "shelf_location", length = 80)
    private String shelfLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private BatchStatus status = BatchStatus.ACTIVE;

    @Column(name = "quarantine_reason", length = 255)
    private String quarantineReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public InventoryBatch(Medicine medicine, String batchNumber, LocalDate manufactureDate, LocalDate expiryDate, int initialQuantity, String shelfLocation) {
        this.medicine = medicine;
        this.batchNumber = batchNumber;
        this.manufactureDate = manufactureDate;
        this.expiryDate = expiryDate;
        this.initialQuantity = initialQuantity;
        this.quantityAvailable = initialQuantity;
        this.shelfLocation = shelfLocation;
        this.status = BatchStatus.ACTIVE;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = BatchStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Integer getStockQuantity() {
        return this.quantityAvailable;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.quantityAvailable = stockQuantity != null ? stockQuantity : 0;
    }

    public LocalDate getManufacturingDate() {
        return this.manufactureDate;
    }

    public void setManufacturingDate(LocalDate manufacturingDate) {
        this.manufactureDate = manufacturingDate;
    }
}
