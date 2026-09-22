package com.medilink.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long medicineId;
    private int quantityOrdered;
    private int quantityFulfilled; // less than ordered = partial fulfillment

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    public OrderItem() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
    public int getQuantityOrdered() { return quantityOrdered; }
    public void setQuantityOrdered(int quantityOrdered) { this.quantityOrdered = quantityOrdered; }
    public int getQuantityFulfilled() { return quantityFulfilled; }
    public void setQuantityFulfilled(int quantityFulfilled) { this.quantityFulfilled = quantityFulfilled; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
}