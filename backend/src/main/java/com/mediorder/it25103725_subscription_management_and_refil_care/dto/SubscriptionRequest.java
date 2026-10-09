package com.mediorder.it25103725_subscription_management_and_refil_care.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public class SubscriptionRequest {
    @NotNull(message = "customerId is required")
    private Long customerId;

    @Min(value = 1, message = "Refill frequency must be at least 1 day")
    @Max(value = 365, message = "Refill frequency must be at most 365 days")
    private Integer frequencyDays;

    @FutureOrPresent(message = "Next refill date cannot be in the past")
    private LocalDate nextRefillDate;

    @Size(max = 50, message = "A subscription can contain at most 50 items")
    private List<@Valid SubscriptionItemDto> items;

    public static class SubscriptionItemDto {
        @NotNull(message = "medicineId is required for each item")
        private Long medicineId;

        @NotNull(message = "quantity is required for each item")
        @Min(value = 1, message = "Item quantity must be at least 1")
        @Max(value = 1000, message = "Item quantity must be at most 1000")
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
