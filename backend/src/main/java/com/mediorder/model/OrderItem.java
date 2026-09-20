package com.mediorder.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "medicine"})
    private InventoryBatch inventoryBatch;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "allocated_batch_number", length = 60)
    private String allocatedBatchNumber;

    @Column(name = "shelf_location", length = 80)
    private String shelfLocation;

    public OrderItem(Order order, Medicine medicine, InventoryBatch inventoryBatch, int quantity, BigDecimal unitPrice) {
        this.order = order;
        this.medicine = medicine;
        this.inventoryBatch = inventoryBatch;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        if (inventoryBatch != null) {
            this.allocatedBatchNumber = inventoryBatch.getBatchNumber();
            this.shelfLocation = inventoryBatch.getShelfLocation();
        }
    }

    public InventoryBatch getBatch() {
        return this.inventoryBatch;
    }

    public void setBatch(InventoryBatch batch) {
        this.inventoryBatch = batch;
        if (batch != null) {
            this.allocatedBatchNumber = batch.getBatchNumber();
            this.shelfLocation = batch.getShelfLocation();
        }
    }

    public void setInventoryBatch(InventoryBatch inventoryBatch) {
        this.inventoryBatch = inventoryBatch;
        if (inventoryBatch != null) {
            this.allocatedBatchNumber = inventoryBatch.getBatchNumber();
            this.shelfLocation = inventoryBatch.getShelfLocation();
        }
    }
}
