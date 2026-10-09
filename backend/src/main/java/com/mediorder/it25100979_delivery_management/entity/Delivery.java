package com.mediorder.it25100979_delivery_management.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A delivery request for one customer order.
 *
 * Created when the customer confirms checkout with a chosen courier partner
 * ({@link #preferredCourier}); the Delivery Coordinator then approves it and assigns
 * the actual courier ({@link #assignedCourier}).
 */
@Entity
@Table(name = "deliveries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Link to other modules -------------------------------------------------
    @Column(name = "order_id")
    private Long orderId;

    /** Customer (users.id) who requested the delivery; null for deliveries recorded by staff. */
    @Column(name = "user_id")
    private Long userId;

    // --- Recipient snapshot (copied at checkout so later profile edits don't change it) ---
    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "order_address", columnDefinition = "TEXT")
    private String orderAddress;

    /** Legacy column kept in sync with {@link #orderAddress} for older rows/modules. */
    @Column(name = "delivery_address", columnDefinition = "TEXT")
    private String deliveryAddress;

    // --- Order details ------------------------------------------------------------
    @Column(name = "items_summary", columnDefinition = "TEXT")
    private String itemsSummary;

    @Column(name = "order_total", precision = 12, scale = 2)
    private BigDecimal orderTotal;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @Column(name = "handling_instructions_snapshot", columnDefinition = "TEXT")
    private String handlingInstructionsSnapshot;

    @Column(name = "cold_chain_tag")
    private Boolean coldChainTag;

    @Column(name = "validating_pharmacist")
    private String validatingPharmacist;

    @Column(name = "arranging_staff")
    private String arrangingStaff;

    // --- Workflow -----------------------------------------------------------------
    @Column(nullable = false)
    @Builder.Default
    private String status = DeliveryStatus.PENDING.name();

    /** Courier partner the customer selected at checkout. */
    @Column(name = "preferred_courier")
    private String preferredCourier;

    /** Courier partner the coordinator actually assigned. */
    @Column(name = "assigned_courier")
    private String assignedCourier;

    @Column(name = "assigned_route")
    private String assignedRoute;

    @Column(name = "batch_id")
    private String batchId;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime approvedAt;

    @Column(name = "dispatched_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dispatchedAt;

    @Column(name = "delivered_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime deliveredAt;

    /** Last hold/postpone/terminate/reject/failure reason. */
    @Column(name = "action_status", length = 50)
    private String actionStatus;

    @Column(name = "action_reason", columnDefinition = "TEXT")
    private String actionReason;

    // --- Handover OTP (only ever shown to the customer who owns the delivery) ------
    @JsonIgnore
    @Column(name = "delivery_otp", length = 10)
    private String deliveryOtp;

    @JsonIgnore
    @Column(name = "otp_expires_at")
    private LocalDateTime otpExpiresAt;

    @JsonIgnore
    @Column(name = "otp_attempts")
    @Builder.Default
    private Integer otpAttempts = 0;

    // --- Audit timestamps ---------------------------------------------------------
    @Column(name = "created_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    public Integer getOtpAttempts() {
        return otpAttempts != null ? otpAttempts : 0;
    }

    @Transient
    @JsonIgnore
    public DeliveryStatus getStatusEnum() {
        return DeliveryStatus.from(status);
    }

    @Transient
    @JsonIgnore
    public void setStatusEnum(DeliveryStatus newStatus) {
        this.status = newStatus.name();
    }

    @PrePersist
    public void prePersist() {
        if (this.status == null || this.status.trim().isEmpty()) {
            this.status = DeliveryStatus.PENDING.name();
        }
        syncAddress();
        if (this.coldChainTag == null) {
            this.coldChainTag = false;
        }
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        syncAddress();
    }

    private void syncAddress() {
        if (this.orderAddress == null && this.deliveryAddress != null) {
            this.orderAddress = this.deliveryAddress;
        } else if (this.orderAddress != null) {
            this.deliveryAddress = this.orderAddress;
        }
    }
}
