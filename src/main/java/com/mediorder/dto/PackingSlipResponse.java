package com.mediorder.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PackingSlipResponse {

    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private String shippingAddress;
    private String orderStatus;
    private LocalDateTime orderDate;
    private LocalDateTime generatedAt;
    private List<PackingSlipItemDto> items = new ArrayList<>();
    private String instructions;

    public PackingSlipResponse() {
        this.generatedAt = LocalDateTime.now();
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public List<PackingSlipItemDto> getItems() {
        return items;
    }

    public void setItems(List<PackingSlipItemDto> items) {
        this.items = items;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }
}
