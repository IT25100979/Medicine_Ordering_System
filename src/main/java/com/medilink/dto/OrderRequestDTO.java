package com.medilink.dto;

import java.util.List;

public class OrderRequestDTO {
    private Long customerId;
    private List<OrderItemRequest> items;

    public static class OrderItemRequest {
        private Long medicineId;
        private int quantity;

        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}