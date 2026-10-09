package com.mediorder.it25103725_subscription_management_and_refil_care.dto;

import com.mediorder.it25103725_subscription_management_and_refil_care.dto.SubscriptionRequest.SubscriptionItemDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

/** A customer setting up their own refill subscription (the customer comes from the login, not the body). */
public class CustomerSubscriptionRequest {

    @NotNull(message = "Choose how often the refill should repeat")
    @Min(value = 7, message = "Refill frequency must be at least 7 days")
    @Max(value = 180, message = "Refill frequency must be at most 180 days")
    private Integer frequencyDays;

    @FutureOrPresent(message = "First refill date cannot be in the past")
    private LocalDate nextRefillDate;

    /** Required when any item is prescription-only: one of the customer's APPROVED prescriptions. */
    private Long prescriptionId;

    @NotEmpty(message = "Add at least one medicine to the subscription")
    @Size(max = 20, message = "A subscription can contain at most 20 medicines")
    private List<@Valid SubscriptionItemDto> items;

    public Integer getFrequencyDays() { return frequencyDays; }
    public void setFrequencyDays(Integer frequencyDays) { this.frequencyDays = frequencyDays; }

    public LocalDate getNextRefillDate() { return nextRefillDate; }
    public void setNextRefillDate(LocalDate nextRefillDate) { this.nextRefillDate = nextRefillDate; }

    public Long getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }

    public List<SubscriptionItemDto> getItems() { return items; }
    public void setItems(List<SubscriptionItemDto> items) { this.items = items; }
}
