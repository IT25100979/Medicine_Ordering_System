package com.mediorder.it25103725_subscription_management_and_refil_care.model;

import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subscription_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(nullable = false)
    private Integer quantity;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Subscription getSubscription() { return subscription; }
    public void setSubscription(Subscription subscription) { this.subscription = subscription; }
    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public static SubscriptionItemBuilder builder() { return new SubscriptionItemBuilder(); }

    public static class SubscriptionItemBuilder {
        private Long id;
        private Subscription subscription;
        private Medicine medicine;
        private Integer quantity;

        public SubscriptionItemBuilder id(Long id) { this.id = id; return this; }
        public SubscriptionItemBuilder subscription(Subscription subscription) { this.subscription = subscription; return this; }
        public SubscriptionItemBuilder medicine(Medicine medicine) { this.medicine = medicine; return this; }
        public SubscriptionItemBuilder quantity(Integer quantity) { this.quantity = quantity; return this; }

        public SubscriptionItem build() {
            SubscriptionItem item = new SubscriptionItem();
            item.setId(this.id);
            item.setSubscription(this.subscription);
            item.setMedicine(this.medicine);
            item.setQuantity(this.quantity);
            return item;
        }
    }
}

