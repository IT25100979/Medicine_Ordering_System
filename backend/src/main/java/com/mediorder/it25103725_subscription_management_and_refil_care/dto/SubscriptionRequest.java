package com.mediorder.it25103725_subscription_management_and_refil_care.dto;

import java.time.LocalDate;
import java.util.List;

public class SubscriptionRequest {
    private Long customerId;
    private Integer frequencyDays;
    private LocalDate nextRefillDate;
    private List<SubscriptionItemDto> items;

    public static class SubscriptionItemDto {
        private Long medicineId;
        private Integer quantity;

        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    public SubscriptionRequest() {}

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Integer getFrequencyDays() { return frequencyDays; }
    public void setFrequencyDays(Integer frequencyDays) { this.frequencyDays = frequencyDays; }

    public LocalDate getNextRefillDate() { return nextRefillDate; }
    public void setNextRefillDate(LocalDate nextRefillDate) { this.nextRefillDate = nextRefillDate; }

    public List<SubscriptionItemDto> getItems() { return items; }
    public void setItems(List<SubscriptionItemDto> items) { this.items = items; }
}
