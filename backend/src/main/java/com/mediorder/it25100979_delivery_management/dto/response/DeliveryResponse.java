package com.mediorder.it25100979_delivery_management.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Delivery as seen by Delivery Management staff.
 * Deliberately has no OTP field: the handover code is only ever shown to the customer.
 */
@Getter
@Builder
public class DeliveryResponse {
    private Long id;
    private Long orderId;
    private Long userId;

    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String orderAddress;

    private String itemsSummary;
    private BigDecimal orderTotal;
    private String specialInstructions;
    private Boolean coldChainTag;
    private String validatingPharmacist;
    private String arrangingStaff;

    private String status;
    private String statusLabel;
    private String preferredCourier;
    private String assignedCourier;
    private String assignedRoute;
    private String batchId;

    private String approvedBy;
    private LocalDateTime approvedAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;
    private String actionStatus;
    private String actionReason;

    /** True once a handover OTP has been issued to the customer. */
    private boolean otpIssued;
    private Integer otpAttempts;

    /** Statuses this delivery may move to next - lets the UI show only valid buttons. */
    private List<String> nextStatuses;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Kept for older UI code that reads {@code deliveryId}. */
    public Long getDeliveryId() {
        return id;
    }
}
