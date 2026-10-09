package com.mediorder.it25101882_cold_chain_tagging.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class ColdChainTelemetryRequest {
    @NotNull(message = "deliveryId is required")
    private Long deliveryId;

    @Size(max = 100, message = "deviceId must be at most 100 characters")
    private String deviceId;

    @NotNull(message = "temperatureRecorded is required")
    @DecimalMin(value = "-40.0", message = "Temperature reading below sensor range (-40°C)")
    @DecimalMax(value = "80.0", message = "Temperature reading above sensor range (80°C)")
    private BigDecimal temperatureRecorded;

    @DecimalMin(value = "0.0", message = "Humidity must be between 0 and 100%")
    @DecimalMax(value = "100.0", message = "Humidity must be between 0 and 100%")
    private BigDecimal humidityRecorded;

    public ColdChainTelemetryRequest() {}

    public Long getDeliveryId() { return deliveryId; }
    public void setDeliveryId(Long deliveryId) { this.deliveryId = deliveryId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public BigDecimal getTemperatureRecorded() { return temperatureRecorded; }
    public void setTemperatureRecorded(BigDecimal temperatureRecorded) { this.temperatureRecorded = temperatureRecorded; }

    public BigDecimal getHumidityRecorded() { return humidityRecorded; }
    public void setHumidityRecorded(BigDecimal humidityRecorded) { this.humidityRecorded = humidityRecorded; }
}
