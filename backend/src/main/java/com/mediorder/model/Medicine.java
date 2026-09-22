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

    @Column(nullable = false)
    private String name;

    @Column(name = "generic_name")
    private String genericName;

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(name = "requires_prescription", nullable = false)
    @Builder.Default
    private Boolean requiresPrescription = false;

    @Column(name = "is_temperature_sensitive", nullable = false)
    @Builder.Default
    private Boolean isTemperatureSensitive = false;

    @Column(name = "min_temp", precision = 4, scale = 2)
    private BigDecimal minTemp;

    @Column(name = "max_temp", precision = 4, scale = 2)
    private BigDecimal maxTemp;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
