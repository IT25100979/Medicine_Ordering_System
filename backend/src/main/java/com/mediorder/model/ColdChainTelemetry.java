package com.mediorder.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cold_chain_telemetry")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColdChainTelemetry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_id", nullable = false)
    private Delivery delivery;

    @Column(name = "device_id", nullable = false, length = 100)
    private String deviceId;

    @Column(name = "temperature_recorded", nullable = false, precision = 5, scale = 2)
    private BigDecimal temperatureRecorded;

    @Column(name = "humidity_recorded", precision = 5, scale = 2)
    private BigDecimal humidityRecorded;

    @Column(name = "breach_flag")
    @Builder.Default
    private Boolean breachFlag = false;

    @Column(name = "recorded_at", insertable = false, updatable = false)
    private LocalDateTime recordedAt;
}
