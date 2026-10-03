package com.mediorder.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicines")
public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "generic_name")
    private String genericName;

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(name = "requires_prescription", nullable = false)
    private Boolean requiresPrescription = false;

    @Column(name = "is_temperature_sensitive", nullable = false)
    private Boolean isTemperatureSensitive = false;

    @Column(name = "min_temp", precision = 4, scale = 2)
    private BigDecimal minTemp;

    @Column(name = "max_temp", precision = 4, scale = 2)
    private BigDecimal maxTemp;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Medicine() {}

    public Medicine(Long id, String name, String genericName, String sku,
                    Boolean requiresPrescription, Boolean isTemperatureSensitive,
                    BigDecimal minTemp, BigDecimal maxTemp, BigDecimal unitPrice,
                    LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.genericName = genericName;
        this.sku = sku;
        this.requiresPrescription = requiresPrescription != null ? requiresPrescription : false;
        this.isTemperatureSensitive = isTemperatureSensitive != null ? isTemperatureSensitive : false;
        this.minTemp = minTemp;
        this.maxTemp = maxTemp;
        this.unitPrice = unitPrice != null ? unitPrice : BigDecimal.ZERO;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.requiresPrescription == null) {
            this.requiresPrescription = false;
        }
        if (this.isTemperatureSensitive == null) {
            this.isTemperatureSensitive = false;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public Boolean getRequiresPrescription() { return requiresPrescription; }
    public void setRequiresPrescription(Boolean requiresPrescription) { this.requiresPrescription = requiresPrescription; }

    public Boolean getIsTemperatureSensitive() { return isTemperatureSensitive; }
    public void setIsTemperatureSensitive(Boolean isTemperatureSensitive) { this.isTemperatureSensitive = isTemperatureSensitive; }

    public BigDecimal getMinTemp() { return minTemp; }
    public void setMinTemp(BigDecimal minTemp) { this.minTemp = minTemp; }

    public BigDecimal getMaxTemp() { return maxTemp; }
    public void setMaxTemp(BigDecimal maxTemp) { this.maxTemp = maxTemp; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static MedicineBuilder builder() {
        return new MedicineBuilder();
    }

    public static class MedicineBuilder {
        private Long id;
        private String name;
        private String genericName;
        private String sku;
        private Boolean requiresPrescription = false;
        private Boolean isTemperatureSensitive = false;
        private BigDecimal minTemp;
        private BigDecimal maxTemp;
        private BigDecimal unitPrice = BigDecimal.ZERO;
        private LocalDateTime createdAt;

        public MedicineBuilder id(Long id) { this.id = id; return this; }
        public MedicineBuilder name(String name) { this.name = name; return this; }
        public MedicineBuilder genericName(String genericName) { this.genericName = genericName; return this; }
        public MedicineBuilder sku(String sku) { this.sku = sku; return this; }
        public MedicineBuilder requiresPrescription(Boolean requiresPrescription) { this.requiresPrescription = requiresPrescription; return this; }
        public MedicineBuilder isTemperatureSensitive(Boolean isTemperatureSensitive) { this.isTemperatureSensitive = isTemperatureSensitive; return this; }
        public MedicineBuilder minTemp(BigDecimal minTemp) { this.minTemp = minTemp; return this; }
        public MedicineBuilder maxTemp(BigDecimal maxTemp) { this.maxTemp = maxTemp; return this; }
        public MedicineBuilder unitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; return this; }
        public MedicineBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Medicine build() {
            Medicine m = new Medicine();
            m.setId(this.id);
            m.setName(this.name);
            m.setGenericName(this.genericName);
            m.setSku(this.sku);
            m.setRequiresPrescription(this.requiresPrescription != null ? this.requiresPrescription : false);
            m.setIsTemperatureSensitive(this.isTemperatureSensitive != null ? this.isTemperatureSensitive : false);
            m.setMinTemp(this.minTemp);
            m.setMaxTemp(this.maxTemp);
            m.setUnitPrice(this.unitPrice != null ? this.unitPrice : BigDecimal.ZERO);
            m.setCreatedAt(this.createdAt != null ? this.createdAt : LocalDateTime.now());
            return m;
        }
    }
}
