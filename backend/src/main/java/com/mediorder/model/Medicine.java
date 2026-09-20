package com.mediorder.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "generic_name", length = 150)
    private String genericName;

    @Column(length = 100)
    private String sku;

    @Column(length = 100)
    private String category;

    @Column(length = 100)
    private String dosage;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "requires_prescription", nullable = false)
    @Builder.Default
    private boolean requiresPrescription = false;

    @Column(name = "is_temperature_sensitive")
    @Builder.Default
    private Boolean isTemperatureSensitive = false;

    @Column(name = "min_temp", precision = 4, scale = 2)
    private BigDecimal minTemp;

    @Column(name = "max_temp", precision = 4, scale = 2)
    private BigDecimal maxTemp;

    @Column(name = "reorder_threshold", nullable = false)
    @Builder.Default
    private int reorderThreshold = 50;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Medicine(String name, String genericName, String category, String dosage, BigDecimal unitPrice, boolean requiresPrescription, int reorderThreshold) {
        this.name = name;
        this.genericName = genericName;
        this.category = category;
        this.dosage = dosage;
        this.unitPrice = unitPrice;
        this.requiresPrescription = requiresPrescription;
        this.reorderThreshold = reorderThreshold;
        this.isActive = true;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (sku == null || sku.isBlank()) {
            sku = "SKU-" + System.currentTimeMillis();
        }
    }
}
