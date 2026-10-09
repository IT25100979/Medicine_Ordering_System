package com.mediorder.it25103725_subscription_management_and_refil_care.model;

import com.mediorder.system_build_functions.model.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(name = "frequency_days", nullable = false)
    @Builder.Default
    private Integer frequencyDays = 30;

    @Column(name = "next_refill_date", nullable = false)
    private LocalDate nextRefillDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }
    public Integer getFrequencyDays() { return frequencyDays; }
    public void setFrequencyDays(Integer frequencyDays) { this.frequencyDays = frequencyDays; }
    public LocalDate getNextRefillDate() { return nextRefillDate; }
    public void setNextRefillDate(LocalDate nextRefillDate) { this.nextRefillDate = nextRefillDate; }
    public SubscriptionStatus getStatus() { return status; }
    public void setStatus(SubscriptionStatus status) { this.status = status; }
    // --- Where each refill is delivered ---
    @Column(name = "delivery_address", columnDefinition = "TEXT")
    private String deliveryAddress;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "preferred_courier", length = 50)
    private String preferredCourier;

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getPreferredCourier() { return preferredCourier; }
    public void setPreferredCourier(String preferredCourier) { this.preferredCourier = preferredCourier; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static SubscriptionBuilder builder() { return new SubscriptionBuilder(); }

    public static class SubscriptionBuilder {
        private Long id;
        private User customer;
        private Integer frequencyDays = 30;
        private LocalDate nextRefillDate;
        private SubscriptionStatus status = SubscriptionStatus.ACTIVE;
        private LocalDateTime createdAt;

        public SubscriptionBuilder id(Long id) { this.id = id; return this; }
        public SubscriptionBuilder customer(User customer) { this.customer = customer; return this; }
        public SubscriptionBuilder frequencyDays(Integer frequencyDays) { this.frequencyDays = frequencyDays; return this; }
        public SubscriptionBuilder nextRefillDate(LocalDate nextRefillDate) { this.nextRefillDate = nextRefillDate; return this; }
        public SubscriptionBuilder status(SubscriptionStatus status) { this.status = status; return this; }
        public SubscriptionBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Subscription build() {
            Subscription s = new Subscription();
            s.setId(this.id);
            s.setCustomer(this.customer);
            s.setFrequencyDays(this.frequencyDays);
            s.setNextRefillDate(this.nextRefillDate);
            s.setStatus(this.status);
            s.setCreatedAt(this.createdAt);
            return s;
        }
    }
}

