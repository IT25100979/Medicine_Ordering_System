package com.mediorder.it25101882_cold_chain_tagging.dto;

import java.math.BigDecimal;

public class ColdChainTelemetryRequest {
    private Long deliveryId;
    private String deviceId;
    private BigDecimal temperatureRecorded;
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
