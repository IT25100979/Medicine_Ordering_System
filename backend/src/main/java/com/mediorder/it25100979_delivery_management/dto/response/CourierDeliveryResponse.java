package com.mediorder.it25100979_delivery_management.dto.response;

import lombok.Builder;
import lombok.Getter;

/** Minimal view for couriers: who, where, how to handle it. No OTP, no order totals. */
@Getter
@Builder
public class CourierDeliveryResponse {
    private Long deliveryId;
    private String batchId;
    private String customerName;
    private String orderAddress;
    private String customerPhone;
    private String status;
    private String assignedCourier;
    private String assignedRoute;
    private String specialInstructions;
    private Boolean coldChainTag;
    private Integer otpAttempts;
}
