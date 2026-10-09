package com.mediorder.it25101882_cold_chain_tagging.model;

import com.mediorder.it25100979_delivery_management.entity.Delivery;
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Delivery getDelivery() { return delivery; }
    public void setDelivery(Delivery delivery) { this.delivery = delivery; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public BigDecimal getTemperatureRecorded() { return temperatureRecorded; }
    public void setTemperatureRecorded(BigDecimal temperatureRecorded) { this.temperatureRecorded = temperatureRecorded; }
    public BigDecimal getHumidityRecorded() { return humidityRecorded; }
    public void setHumidityRecorded(BigDecimal humidityRecorded) { this.humidityRecorded = humidityRecorded; }
    public Boolean getBreachFlag() { return breachFlag; }
    public void setBreachFlag(Boolean breachFlag) { this.breachFlag = breachFlag; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }

    public static ColdChainTelemetryBuilder builder() { return new ColdChainTelemetryBuilder(); }

    public static class ColdChainTelemetryBuilder {
        private Long id;
        private Delivery delivery;
        private String deviceId;
        private BigDecimal temperatureRecorded;
        private BigDecimal humidityRecorded;
        private Boolean breachFlag = false;
        private LocalDateTime recordedAt;

        public ColdChainTelemetryBuilder id(Long id) { this.id = id; return this; }
        public ColdChainTelemetryBuilder delivery(Delivery delivery) { this.delivery = delivery; return this; }
        public ColdChainTelemetryBuilder deviceId(String deviceId) { this.deviceId = deviceId; return this; }
        public ColdChainTelemetryBuilder temperatureRecorded(BigDecimal temperatureRecorded) { this.temperatureRecorded = temperatureRecorded; return this; }
        public ColdChainTelemetryBuilder humidityRecorded(BigDecimal humidityRecorded) { this.humidityRecorded = humidityRecorded; return this; }
        public ColdChainTelemetryBuilder breachFlag(Boolean breachFlag) { this.breachFlag = breachFlag; return this; }
        public ColdChainTelemetryBuilder recordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; return this; }

        public ColdChainTelemetry build() {
            ColdChainTelemetry t = new ColdChainTelemetry();
            t.setId(this.id);
            t.setDelivery(this.delivery);
            t.setDeviceId(this.deviceId);
            t.setTemperatureRecorded(this.temperatureRecorded);
            t.setHumidityRecorded(this.humidityRecorded);
            t.setBreachFlag(this.breachFlag);
            t.setRecordedAt(this.recordedAt);
            return t;
        }
    }
}

