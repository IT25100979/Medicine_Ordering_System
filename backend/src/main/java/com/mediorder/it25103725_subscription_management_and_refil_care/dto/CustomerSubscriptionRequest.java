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

    @NotBlank(message = "Enter the delivery address for your refills")
    @Size(min = 5, max = 500, message = "Delivery address must be between 5 and 500 characters")
    private String deliveryAddress;

    @NotBlank(message = "Enter a contact phone number")
    @com.mediorder.system_build_functions.validation.ValidPhone
    private String contactPhone;

    @Size(max = 50, message = "Unknown delivery partner")
    private String preferredCourier;

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

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getPreferredCourier() { return preferredCourier; }
    public void setPreferredCourier(String preferredCourier) { this.preferredCourier = preferredCourier; }

    public List<SubscriptionItemDto> getItems() { return items; }
    public void setItems(List<SubscriptionItemDto> items) { this.items = items; }
}
