package com.mediorder.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
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

    public OrderItem() {
    }

    public OrderItem(Order order, Medicine medicine, InventoryBatch inventoryBatch, int quantity, BigDecimal unitPrice) {
        this.order = order;
        this.medicine = medicine;
        this.inventoryBatch = inventoryBatch;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        this.allocatedBatchNumber = inventoryBatch.getBatchNumber();
        this.shelfLocation = inventoryBatch.getShelfLocation();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }

    public InventoryBatch getInventoryBatch() {
        return inventoryBatch;
    }

    public void setInventoryBatch(InventoryBatch inventoryBatch) {
        this.inventoryBatch = inventoryBatch;
        if (inventoryBatch != null) {
            this.allocatedBatchNumber = inventoryBatch.getBatchNumber();
            this.shelfLocation = inventoryBatch.getShelfLocation();
        }
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
        if (unitPrice != null) {
            this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
        if (unitPrice != null) {
            this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public String getAllocatedBatchNumber() {
        return allocatedBatchNumber;
    }

    public void setAllocatedBatchNumber(String allocatedBatchNumber) {
        this.allocatedBatchNumber = allocatedBatchNumber;
    }

    public String getShelfLocation() {
        return shelfLocation;
    }

    public void setShelfLocation(String shelfLocation) {
        this.shelfLocation = shelfLocation;
    }
}
