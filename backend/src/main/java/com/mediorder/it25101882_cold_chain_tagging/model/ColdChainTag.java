package com.mediorder.it25101882_cold_chain_tagging.model;

import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cold_chain_tags", indexes = {
    @Index(name = "idx_tag_medicine", columnList = "medicine_id", unique = true),
    @Index(name = "idx_tag_section", columnList = "section"),
    @Index(name = "idx_tag_status", columnList = "status")
})
public class ColdChainTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false, unique = true)
    private Medicine medicine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ColdChainSection section = ColdChainSection.AMBIENT;

    @Column(name = "storage_temp_min", precision = 4, scale = 2)
    private BigDecimal storageTempMin;

    @Column(name = "storage_temp_max", precision = 4, scale = 2)
    private BigDecimal storageTempMax;

    @Column(name = "shelf_life_days")
    private Integer shelfLifeDays = 730;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MedicineIntensity intensity = MedicineIntensity.LOW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SecurityLevel securityLevel = SecurityLevel.STANDARD;

    @Column(name = "delivery_actions", columnDefinition = "TEXT")
    private String deliveryActions; // Comma-separated or JSON of handling instructions

    @Column(nullable = false, length = 30)
    private String status = "APPROVED"; // DRAFT, PENDING_REVIEW, APPROVED

    @Column(name = "reviewed_by", length = 150)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "dual_confirmed_by", length = 150)
    private String dualConfirmedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ColdChainTag() {}

    public ColdChainTag(Long id, Medicine medicine, ColdChainSection section, BigDecimal storageTempMin,
                        BigDecimal storageTempMax, Integer shelfLifeDays, MedicineIntensity intensity,
                        SecurityLevel securityLevel, String deliveryActions, String status,
                        String reviewedBy, LocalDateTime reviewedAt, String dualConfirmedBy,
                        LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.medicine = medicine;
        this.section = section != null ? section : ColdChainSection.AMBIENT;
        this.storageTempMin = storageTempMin;
        this.storageTempMax = storageTempMax;
        this.shelfLifeDays = shelfLifeDays != null ? shelfLifeDays : 730;
        this.intensity = intensity != null ? intensity : MedicineIntensity.LOW;
        this.securityLevel = securityLevel != null ? securityLevel : SecurityLevel.STANDARD;
        this.deliveryActions = deliveryActions;
        this.status = status != null ? status : "APPROVED";
        this.reviewedBy = reviewedBy;
        this.reviewedAt = reviewedAt;
        this.dualConfirmedBy = dualConfirmedBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.section == null) {
            this.section = ColdChainSection.AMBIENT;
        }
        if (this.intensity == null) {
            this.intensity = MedicineIntensity.LOW;
        }
        if (this.securityLevel == null) {
            this.securityLevel = SecurityLevel.STANDARD;
        }
        if (this.status == null) {
            this.status = "APPROVED";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }
    public ColdChainSection getSection() { return section; }
    public void setSection(ColdChainSection section) { this.section = section; }
    public BigDecimal getStorageTempMin() { return storageTempMin; }
    public void setStorageTempMin(BigDecimal storageTempMin) { this.storageTempMin = storageTempMin; }
    public BigDecimal getStorageTempMax() { return storageTempMax; }
    public void setStorageTempMax(BigDecimal storageTempMax) { this.storageTempMax = storageTempMax; }
    public Integer getShelfLifeDays() { return shelfLifeDays; }
    public void setShelfLifeDays(Integer shelfLifeDays) { this.shelfLifeDays = shelfLifeDays; }
    public MedicineIntensity getIntensity() { return intensity; }
    public void setIntensity(MedicineIntensity intensity) { this.intensity = intensity; }
    public SecurityLevel getSecurityLevel() { return securityLevel; }
    public void setSecurityLevel(SecurityLevel securityLevel) { this.securityLevel = securityLevel; }
    public String getDeliveryActions() { return deliveryActions; }
    public void setDeliveryActions(String deliveryActions) { this.deliveryActions = deliveryActions; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public String getDualConfirmedBy() { return dualConfirmedBy; }
    public void setDualConfirmedBy(String dualConfirmedBy) { this.dualConfirmedBy = dualConfirmedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static ColdChainTagBuilder builder() {
        return new ColdChainTagBuilder();
    }

    public static class ColdChainTagBuilder {
        private Long id;
        private Medicine medicine;
        private ColdChainSection section = ColdChainSection.AMBIENT;
        private BigDecimal storageTempMin;
        private BigDecimal storageTempMax;
        private Integer shelfLifeDays = 730;
        private MedicineIntensity intensity = MedicineIntensity.LOW;
        private SecurityLevel securityLevel = SecurityLevel.STANDARD;
        private String deliveryActions;
        private String status = "APPROVED";
        private String reviewedBy;
        private LocalDateTime reviewedAt;
        private String dualConfirmedBy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public ColdChainTagBuilder id(Long id) { this.id = id; return this; }
        public ColdChainTagBuilder medicine(Medicine medicine) { this.medicine = medicine; return this; }
        public ColdChainTagBuilder section(ColdChainSection section) { this.section = section; return this; }
        public ColdChainTagBuilder storageTempMin(BigDecimal storageTempMin) { this.storageTempMin = storageTempMin; return this; }
        public ColdChainTagBuilder storageTempMax(BigDecimal storageTempMax) { this.storageTempMax = storageTempMax; return this; }
        public ColdChainTagBuilder shelfLifeDays(Integer shelfLifeDays) { this.shelfLifeDays = shelfLifeDays; return this; }
        public ColdChainTagBuilder intensity(MedicineIntensity intensity) { this.intensity = intensity; return this; }
        public ColdChainTagBuilder securityLevel(SecurityLevel securityLevel) { this.securityLevel = securityLevel; return this; }
        public ColdChainTagBuilder deliveryActions(String deliveryActions) { this.deliveryActions = deliveryActions; return this; }
        public ColdChainTagBuilder status(String status) { this.status = status; return this; }
        public ColdChainTagBuilder reviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; return this; }
        public ColdChainTagBuilder reviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; return this; }
        public ColdChainTagBuilder dualConfirmedBy(String dualConfirmedBy) { this.dualConfirmedBy = dualConfirmedBy; return this; }
        public ColdChainTagBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ColdChainTagBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public ColdChainTag build() {
            return new ColdChainTag(id, medicine, section, storageTempMin, storageTempMax, shelfLifeDays,
                    intensity, securityLevel, deliveryActions, status, reviewedBy, reviewedAt, dualConfirmedBy,
                    createdAt, updatedAt);
        }
    }
}
