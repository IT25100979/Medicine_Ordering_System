package com.mediorder.it25100979_delivery_management.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_id")
    @JsonProperty("batchId")
    private String batchId;

    @Column(name = "customer_name")
    @JsonProperty("customerName")
    private String customerName;

    @Column(name = "order_address", columnDefinition = "TEXT")
    @JsonProperty("orderAddress")
    private String orderAddress;

    @Column(name = "customer_phone")
    @JsonProperty("customerPhone")
    private String customerPhone;

    @Column(name = "customer_email")
    @JsonProperty("customerEmail")
    private String customerEmail;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    @JsonProperty("specialInstructions")
    private String specialInstructions;

    @Column(name = "validating_pharmacist")
    @JsonProperty("validatingPharmacist")
    private String validatingPharmacist;

    @Column(name = "arranging_staff")
    @JsonProperty("arrangingStaff")
    private String arrangingStaff;

    @Column(nullable = false)
    private String status = DeliveryStatus.PENDING.name();

    @Column(name = "assigned_route")
    @JsonProperty("assignedRoute")
    private String assignedRoute;

    @Column(name = "assigned_courier")
    @JsonProperty("assignedCourier")
    private String assignedCourier;

    @Column(name = "order_id")
    @JsonProperty("orderId")
    private Long orderId;

    @Column(name = "delivery_otp", length = 10)
    @JsonProperty("deliveryOtp")
    private String deliveryOtp;

    @Column(name = "otp_hash")
    private String otpHash;

    @Column(name = "otp_expires_at")
    private LocalDateTime otpExpiresAt;

    @Column(name = "otp_attempts")
    private Integer otpAttempts = 0;

    @Column(name = "handling_instructions_snapshot", columnDefinition = "TEXT")
    @JsonProperty("handlingInstructionsSnapshot")
    private String handlingInstructionsSnapshot;

    @Column(name = "action_status", length = 50)
    private String actionStatus;

    @Column(name = "action_reason", columnDefinition = "TEXT")
    private String actionReason;

    // --- Compatibility fields with earlier versions & modules ---
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "pharmacist_id")
    private Long pharmacistId;

    @Column(name = "delivery_address", columnDefinition = "TEXT")
    private String deliveryAddress;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cold_chain_tag")
    private Boolean coldChainTag;

    @Column(name = "initial_date")
    private LocalDate initialDate;

    @Column(name = "final_date")
    private LocalDate finalDate;

    @Column(name = "created_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    @Column(name = "delivered_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime deliveredAt;

    public Delivery() {
        this.status = DeliveryStatus.PENDING.name();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @JsonProperty("deliveryId")
    public Long getDeliveryId() { return id; }
    public void setDeliveryId(Long deliveryId) { this.id = deliveryId; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getOrderAddress() { return orderAddress; }
    public void setOrderAddress(String orderAddress) { this.orderAddress = orderAddress; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public String getValidatingPharmacist() { return validatingPharmacist; }
    public void setValidatingPharmacist(String validatingPharmacist) { this.validatingPharmacist = validatingPharmacist; }

    public String getArrangingStaff() { return arrangingStaff; }
    public void setArrangingStaff(String arrangingStaff) { this.arrangingStaff = arrangingStaff; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAssignedRoute() { return assignedRoute; }
    public void setAssignedRoute(String assignedRoute) { this.assignedRoute = assignedRoute; }

    public String getAssignedCourier() { return assignedCourier; }
    public void setAssignedCourier(String assignedCourier) { this.assignedCourier = assignedCourier; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getDeliveryOtp() { return deliveryOtp; }
    public void setDeliveryOtp(String deliveryOtp) { this.deliveryOtp = deliveryOtp; }

    public String getOtpHash() { return otpHash; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }

    public LocalDateTime getOtpExpiresAt() { return otpExpiresAt; }
    public void setOtpExpiresAt(LocalDateTime otpExpiresAt) { this.otpExpiresAt = otpExpiresAt; }

    public Integer getOtpAttempts() { return otpAttempts != null ? otpAttempts : 0; }
    public void setOtpAttempts(Integer otpAttempts) { this.otpAttempts = otpAttempts; }

    public String getHandlingInstructionsSnapshot() { return handlingInstructionsSnapshot; }
    public void setHandlingInstructionsSnapshot(String handlingInstructionsSnapshot) { this.handlingInstructionsSnapshot = handlingInstructionsSnapshot; }

    public String getActionStatus() { return actionStatus; }
    public void setActionStatus(String actionStatus) { this.actionStatus = actionStatus; }

    public String getActionReason() { return actionReason; }
    public void setActionReason(String actionReason) { this.actionReason = actionReason; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getPharmacistId() { return pharmacistId; }
    public void setPharmacistId(Long pharmacistId) { this.pharmacistId = pharmacistId; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getColdChainTag() { return coldChainTag; }
    public void setColdChainTag(Boolean coldChainTag) { this.coldChainTag = coldChainTag; }

    public LocalDate getInitialDate() { return initialDate; }
    public void setInitialDate(LocalDate initialDate) { this.initialDate = initialDate; }

    public LocalDate getFinalDate() { return finalDate; }
    public void setFinalDate(LocalDate finalDate) { this.finalDate = finalDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    @PrePersist
    public void prePersist() {
        if (this.status == null || this.status.trim().isEmpty()) {
            this.status = DeliveryStatus.PENDING.name();
        }
        if (this.orderAddress == null && this.deliveryAddress != null) {
            this.orderAddress = this.deliveryAddress;
        } else if (this.deliveryAddress == null && this.orderAddress != null) {
            this.deliveryAddress = this.orderAddress;
        }
        if (this.coldChainTag == null) {
            this.coldChainTag = (this.specialInstructions != null && 
                this.specialInstructions.toLowerCase().contains("cold chain"));
        }
        if (this.userId == null) {
            this.userId = 1L;
        }
        if (this.initialDate == null) {
            this.initialDate = LocalDate.now();
        }
        if (this.finalDate == null) {
            this.finalDate = this.initialDate.plusDays(2);
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.orderAddress == null && this.deliveryAddress != null) {
            this.orderAddress = this.deliveryAddress;
        } else if (this.deliveryAddress == null && this.orderAddress != null) {
            this.deliveryAddress = this.orderAddress;
        }
    }

    public static DeliveryBuilder builder() {
        return new DeliveryBuilder();
    }

    public static class DeliveryBuilder {
        private Long id;
        private String batchId;
        private String customerName;
        private String orderAddress;
        private String customerPhone;
        private String customerEmail;
        private String specialInstructions;
        private String validatingPharmacist;
        private String arrangingStaff;
        private String status = DeliveryStatus.PENDING.name();
        private String assignedRoute;
        private String assignedCourier;
        private Long orderId;
        private String deliveryOtp;
        private String otpHash;
        private LocalDateTime otpExpiresAt;
        private Integer otpAttempts = 0;
        private String handlingInstructionsSnapshot;
        private String actionStatus;
        private String actionReason;
        private Long userId;
        private Long pharmacistId;
        private String deliveryAddress;
        private String description;
        private Boolean coldChainTag;
        private LocalDate initialDate;
        private LocalDate finalDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime deliveredAt;

        public DeliveryBuilder id(Long id) { this.id = id; return this; }
        public DeliveryBuilder orderId(Long orderId) { this.orderId = orderId; return this; }
        public DeliveryBuilder batchId(String batchId) { this.batchId = batchId; return this; }
        public DeliveryBuilder customerName(String customerName) { this.customerName = customerName; return this; }
        public DeliveryBuilder orderAddress(String orderAddress) { this.orderAddress = orderAddress; return this; }
        public DeliveryBuilder customerPhone(String customerPhone) { this.customerPhone = customerPhone; return this; }
        public DeliveryBuilder customerEmail(String customerEmail) { this.customerEmail = customerEmail; return this; }
        public DeliveryBuilder specialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; return this; }
        public DeliveryBuilder validatingPharmacist(String validatingPharmacist) { this.validatingPharmacist = validatingPharmacist; return this; }
        public DeliveryBuilder arrangingStaff(String arrangingStaff) { this.arrangingStaff = arrangingStaff; return this; }
        public DeliveryBuilder status(String status) { this.status = status; return this; }
        public DeliveryBuilder assignedRoute(String assignedRoute) { this.assignedRoute = assignedRoute; return this; }
        public DeliveryBuilder assignedCourier(String assignedCourier) { this.assignedCourier = assignedCourier; return this; }
        public DeliveryBuilder deliveryOtp(String deliveryOtp) { this.deliveryOtp = deliveryOtp; return this; }
        public DeliveryBuilder otpHash(String otpHash) { this.otpHash = otpHash; return this; }
        public DeliveryBuilder otpExpiresAt(LocalDateTime otpExpiresAt) { this.otpExpiresAt = otpExpiresAt; return this; }
        public DeliveryBuilder otpAttempts(Integer otpAttempts) { this.otpAttempts = otpAttempts; return this; }
        public DeliveryBuilder handlingInstructionsSnapshot(String handlingInstructionsSnapshot) { this.handlingInstructionsSnapshot = handlingInstructionsSnapshot; return this; }
        public DeliveryBuilder actionStatus(String actionStatus) { this.actionStatus = actionStatus; return this; }
        public DeliveryBuilder actionReason(String actionReason) { this.actionReason = actionReason; return this; }
        public DeliveryBuilder userId(Long userId) { this.userId = userId; return this; }
        public DeliveryBuilder pharmacistId(Long pharmacistId) { this.pharmacistId = pharmacistId; return this; }
        public DeliveryBuilder deliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; return this; }
        public DeliveryBuilder description(String description) { this.description = description; return this; }
        public DeliveryBuilder coldChainTag(Boolean coldChainTag) { this.coldChainTag = coldChainTag; return this; }
        public DeliveryBuilder initialDate(LocalDate initialDate) { this.initialDate = initialDate; return this; }
        public DeliveryBuilder finalDate(LocalDate finalDate) { this.finalDate = finalDate; return this; }
        public DeliveryBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public DeliveryBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public DeliveryBuilder deliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; return this; }

        public Delivery build() {
            Delivery d = new Delivery();
            d.id = this.id;
            d.orderId = this.orderId;
            d.batchId = this.batchId;
            d.customerName = this.customerName;
            d.orderAddress = this.orderAddress;
            d.customerPhone = this.customerPhone;
            d.customerEmail = this.customerEmail;
            d.specialInstructions = this.specialInstructions;
            d.validatingPharmacist = this.validatingPharmacist;
            d.arrangingStaff = this.arrangingStaff;
            d.status = this.status != null ? this.status : DeliveryStatus.PENDING.name();
            d.assignedRoute = this.assignedRoute;
            d.assignedCourier = this.assignedCourier;
            d.deliveryOtp = this.deliveryOtp;
            d.otpHash = this.otpHash;
            d.otpExpiresAt = this.otpExpiresAt;
            d.otpAttempts = this.otpAttempts != null ? this.otpAttempts : 0;
            d.handlingInstructionsSnapshot = this.handlingInstructionsSnapshot;
            d.actionStatus = this.actionStatus;
            d.actionReason = this.actionReason;
            d.userId = this.userId;
            d.pharmacistId = this.pharmacistId;
            d.deliveryAddress = this.deliveryAddress;
            d.description = this.description;
            d.coldChainTag = this.coldChainTag;
            d.initialDate = this.initialDate;
            d.finalDate = this.finalDate;
            d.createdAt = this.createdAt;
            d.updatedAt = this.updatedAt;
            d.deliveredAt = this.deliveredAt;
            return d;
        }
    }
}
