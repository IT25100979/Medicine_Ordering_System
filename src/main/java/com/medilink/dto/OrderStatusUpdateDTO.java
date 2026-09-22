package com.medilink.dto;

import com.medilink.entity.OrderStatus;

public class OrderStatusUpdateDTO {
    private OrderStatus newStatus;
    private String reason; // cancellation reason, optional otherwise

    public OrderStatus getNewStatus() { return newStatus; }
    public void setNewStatus(OrderStatus newStatus) { this.newStatus = newStatus; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
