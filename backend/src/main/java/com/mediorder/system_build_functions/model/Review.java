package com.mediorder.system_build_functions.model;

import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_review_medicine", columnList = "medicine_id"),
    @Index(name = "idx_review_status", columnList = "status")
})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String comment;

    @Column(name = "verified_purchase", nullable = false)
    private Boolean verifiedPurchase = true;

    @Column(nullable = false, length = 20)
    private String status = "VISIBLE"; // VISIBLE, HIDDEN, REMOVED

    @Column(name = "moderation_reason", length = 255)
    private String moderationReason;

    @Column(name = "moderated_by", length = 150)
    private String moderatedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Review() {}

    public Review(Long id, Medicine medicine, User user, BigDecimal rating, String comment,
                  Boolean verifiedPurchase, String status, String moderationReason,
                  String moderatedBy, LocalDateTime createdAt) {
        this.id = id;
        this.medicine = medicine;
        this.user = user;
        this.rating = rating;
        this.comment = comment;
        this.verifiedPurchase = verifiedPurchase != null ? verifiedPurchase : true;
        this.status = status != null ? status : "VISIBLE";
        this.moderationReason = moderationReason;
        this.moderatedBy = moderatedBy;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "VISIBLE";
        }
        if (this.verifiedPurchase == null) {
            this.verifiedPurchase = true;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public Boolean getVerifiedPurchase() { return verifiedPurchase; }
    public void setVerifiedPurchase(Boolean verifiedPurchase) { this.verifiedPurchase = verifiedPurchase; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getModerationReason() { return moderationReason; }
    public void setModerationReason(String moderationReason) { this.moderationReason = moderationReason; }
    public String getModeratedBy() { return moderatedBy; }
    public void setModeratedBy(String moderatedBy) { this.moderatedBy = moderatedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static ReviewBuilder builder() {
        return new ReviewBuilder();
    }

    public static class ReviewBuilder {
        private Long id;
        private Medicine medicine;
        private User user;
        private BigDecimal rating;
        private String comment;
        private Boolean verifiedPurchase = true;
        private String status = "VISIBLE";
        private String moderationReason;
        private String moderatedBy;
        private LocalDateTime createdAt;

        public ReviewBuilder id(Long id) { this.id = id; return this; }
        public ReviewBuilder medicine(Medicine medicine) { this.medicine = medicine; return this; }
        public ReviewBuilder user(User user) { this.user = user; return this; }
        public ReviewBuilder rating(BigDecimal rating) { this.rating = rating; return this; }
        public ReviewBuilder comment(String comment) { this.comment = comment; return this; }
        public ReviewBuilder verifiedPurchase(Boolean verifiedPurchase) { this.verifiedPurchase = verifiedPurchase; return this; }
        public ReviewBuilder status(String status) { this.status = status; return this; }
        public ReviewBuilder moderationReason(String moderationReason) { this.moderationReason = moderationReason; return this; }
        public ReviewBuilder moderatedBy(String moderatedBy) { this.moderatedBy = moderatedBy; return this; }
        public ReviewBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Review build() {
            return new Review(id, medicine, user, rating, comment, verifiedPurchase, status, moderationReason, moderatedBy, createdAt);
        }
    }
}
