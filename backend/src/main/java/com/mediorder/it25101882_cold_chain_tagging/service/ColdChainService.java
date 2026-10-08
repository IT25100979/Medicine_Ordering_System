package com.mediorder.it25101882_cold_chain_tagging.service;

import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainTelemetryRequest;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainTelemetry;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTelemetryRepository;
import com.mediorder.it25100979_delivery_management.model.Delivery;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ColdChainService {

    @Autowired
    private ColdChainTelemetryRepository telemetryRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    private static final BigDecimal MIN_SAFE_TEMP = new BigDecimal("2.00");
    private static final BigDecimal MAX_SAFE_TEMP = new BigDecimal("8.00");

    @Transactional(readOnly = true)
    public List<ColdChainTelemetry> getAllTelemetry() {
        return telemetryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ColdChainTelemetry> getTelemetryByDelivery(Long deliveryId) {
        return telemetryRepository.findByDeliveryId(deliveryId);
    }

    @Transactional(readOnly = true)
    public List<ColdChainTelemetry> getBreachedTelemetry() {
        return telemetryRepository.findByBreachFlagTrue();
    }

    public ColdChainTelemetry recordTelemetry(ColdChainTelemetryRequest request) {
        Optional<Delivery> deliveryOpt = deliveryRepository.findById(request.getDeliveryId());
        if (deliveryOpt.isEmpty()) {
            throw new IllegalArgumentException("Delivery not found with id: " + request.getDeliveryId());
        }

        boolean isBreached = false;
        if (request.getTemperatureRecorded() != null) {
            if (request.getTemperatureRecorded().compareTo(MIN_SAFE_TEMP) < 0 ||
                request.getTemperatureRecorded().compareTo(MAX_SAFE_TEMP) > 0) {
                isBreached = true;
            }
        }

        ColdChainTelemetry telemetry = ColdChainTelemetry.builder()
                .delivery(deliveryOpt.get())
                .deviceId(request.getDeviceId())
                .temperatureRecorded(request.getTemperatureRecorded())
                .humidityRecorded(request.getHumidityRecorded())
                .breachFlag(isBreached)
                .build();

        return telemetryRepository.save(telemetry);
    }
}
