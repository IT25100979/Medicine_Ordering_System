package com.mediorder.it25100979_delivery_management.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Delivery tracking view for the customer who placed the order. */
@Getter
@Builder
public class CustomerDeliveryResponse {
    private Long id;
    private Long orderId;
    private String status;
    private String statusLabel;
    private String preferredCourier;
    private String assignedCourier;
    private String orderAddress;
    private String customerPhone;
    private String itemsSummary;
    private BigDecimal orderTotal;
    private Boolean coldChainTag;
    private String actionReason;

    /** 4-digit code (1234) the customer gives the courier at the door. Only present while the parcel is with the courier. */
    private String handoverOtp;
    private LocalDateTime otpExpiresAt;

    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;

    private List<DeliveryTimelineResponse> timeline;
}
