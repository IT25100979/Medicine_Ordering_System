package com.mediorder.it25103725_subscription_management_and_refil_care.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Read model of a subscription with its medicines (no lazy entities in the JSON). */
public record SubscriptionView(
        Long id,
        Long customerId,
        String customerName,
        Integer frequencyDays,
        LocalDate nextRefillDate,
        String status,
        LocalDateTime createdAt,
        List<Item> items) {

    public record Item(Long medicineId, String name, Integer quantity, BigDecimal unitPrice, Boolean requiresPrescription) {
    }
}
