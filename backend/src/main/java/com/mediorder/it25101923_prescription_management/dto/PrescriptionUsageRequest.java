package com.mediorder.it25101923_prescription_management.dto;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
public record PrescriptionUsageRequest(@NotNull @Positive Long orderId) {}
