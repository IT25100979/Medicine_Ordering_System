package com.mediorder.system_build_functions.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_methods", indexes = {
    @Index(name = "idx_payment_user", columnList = "user_id")
})
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "provider_token", nullable = false, length = 255)
    private String providerToken; // Secure token from mock/real gateway

    @Column(length = 50)
    private String brand = "Visa"; // Visa, MasterCard, Amex

    @Column(length = 4, nullable = false)
    private String last4;

    @Column(name = "exp_month", nullable = false)
    private Integer expMonth;

    @Column(name = "exp_year", nullable = false)
    private Integer expYear;

    @Column(name = "billing_address_id")
    private Long billingAddressId;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public PaymentMethod() {}

    public PaymentMethod(Long id, User user, String providerToken, String brand, String last4,
                         Integer expMonth, Integer expYear, Long billingAddressId,
                         Boolean isDefault, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.providerToken = providerToken;
        this.brand = brand != null ? brand : "Visa";
        this.last4 = last4;
        this.expMonth = expMonth;
        this.expYear = expYear;
        this.billingAddressId = billingAddressId;
        this.isDefault = isDefault != null ? isDefault : false;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.brand == null) {
            this.brand = "Visa";
        }
        if (this.isDefault == null) {
            this.isDefault = false;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getProviderToken() { return providerToken; }
    public void setProviderToken(String providerToken) { this.providerToken = providerToken; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getLast4() { return last4; }
    public void setLast4(String last4) { this.last4 = last4; }
    public Integer getExpMonth() { return expMonth; }
    public void setExpMonth(Integer expMonth) { this.expMonth = expMonth; }
    public Integer getExpYear() { return expYear; }
    public void setExpYear(Integer expYear) { this.expYear = expYear; }
    public Long getBillingAddressId() { return billingAddressId; }
    public void setBillingAddressId(Long billingAddressId) { this.billingAddressId = billingAddressId; }
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static PaymentMethodBuilder builder() {
        return new PaymentMethodBuilder();
    }

    public static class PaymentMethodBuilder {
        private Long id;
        private User user;
        private String providerToken;
        private String brand = "Visa";
        private String last4;
        private Integer expMonth;
        private Integer expYear;
        private Long billingAddressId;
        private Boolean isDefault = false;
        private LocalDateTime createdAt;

        public PaymentMethodBuilder id(Long id) { this.id = id; return this; }
        public PaymentMethodBuilder user(User user) { this.user = user; return this; }
        public PaymentMethodBuilder providerToken(String providerToken) { this.providerToken = providerToken; return this; }
        public PaymentMethodBuilder brand(String brand) { this.brand = brand; return this; }
        public PaymentMethodBuilder last4(String last4) { this.last4 = last4; return this; }
        public PaymentMethodBuilder expMonth(Integer expMonth) { this.expMonth = expMonth; return this; }
        public PaymentMethodBuilder expYear(Integer expYear) { this.expYear = expYear; return this; }
        public PaymentMethodBuilder billingAddressId(Long billingAddressId) { this.billingAddressId = billingAddressId; return this; }
        public PaymentMethodBuilder isDefault(Boolean isDefault) { this.isDefault = isDefault; return this; }
        public PaymentMethodBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public PaymentMethod build() {
            return new PaymentMethod(id, user, providerToken, brand, last4, expMonth, expYear, billingAddressId, isDefault, createdAt);
        }
    }
}
