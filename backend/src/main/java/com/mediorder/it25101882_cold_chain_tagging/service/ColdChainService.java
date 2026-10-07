package com.mediorder.it25101882_cold_chain_tagging.service;

import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainRequest;
import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainTelemetryRequest;
import com.mediorder.it25101882_cold_chain_tagging.exception.ResourceNotFoundException;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainDelivery;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainTelemetry;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainRepository;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTelemetryRepository;
import com.mediorder.it25100979_delivery_management.model.Delivery;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service class for Cold-Chain Handling & Age-Verification Security Protocols.
 * Encapsulates core business logic, safety range checks, and age security workflows.
 */
@Service
@Transactional
public class ColdChainService {

    private final ColdChainRepository repository;

    @Autowired(required = false)
    private ColdChainTelemetryRepository telemetryRepository;

    @Autowired(required = false)
    private DeliveryRepository deliveryRepository;

    private static final BigDecimal MIN_SAFE_TEMP = new BigDecimal("2.00");
    private static final BigDecimal MAX_SAFE_TEMP = new BigDecimal("8.00");

    public ColdChainService(ColdChainRepository repository) {
        this.repository = repository;
    }

    // ====================================================================
    // COLD CHAIN DELIVERY CRUD OPERATIONS (Used by React ColdChainPage)
    // ====================================================================

    /**
     * Retrieve all cold-chain delivery records from MySQL, latest first.
     */
    @Transactional(readOnly = true)
    public List<ColdChainDelivery> getAllDeliveries() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    /**
     * Retrieve a single cold-chain delivery record by its primary key ID.
     */
    @Transactional(readOnly = true)
    public ColdChainDelivery getDeliveryById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery record not found with ID: " + id));
    }

    /**
     * Create and persist a new Cold-Chain delivery record in MySQL.
     * Applies default 2°C-8°C range, computes temperature status, and enforces age verification rules.
     */
    public ColdChainDelivery createDelivery(ColdChainRequest request) {
        validateBusinessRules(request);

        ColdChainDelivery delivery = new ColdChainDelivery();
        mapDtoToEntity(request, delivery);
        applySecurityAndTemperatureProtocols(delivery);
        delivery.setCreatedAt(LocalDateTime.now());

        return repository.save(delivery);
    }

    /**
     * Update an existing Cold-Chain delivery record in MySQL.
     */
    public ColdChainDelivery updateDelivery(Long id, ColdChainRequest request) {
        validateBusinessRules(request);

        ColdChainDelivery existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cannot update. Delivery record not found with ID: " + id));

        mapDtoToEntity(request, existing);
        applySecurityAndTemperatureProtocols(existing);

        return repository.save(existing);
    }

    /**
     * Delete a Cold-Chain delivery record from MySQL by ID.
     */
    public void deleteDelivery(Long id) {
        ColdChainDelivery existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cannot delete. Delivery record not found with ID: " + id));
        repository.delete(existing);
    }

    /**
     * Enforces the UC-04 Business Logic:
     * 1. Default safe temperature range of 2°C to 8°C for temperature-sensitive shipments.
     * 2. Automatic Temperature Status calculation:
     *    - If Current Temperature > Max or Current Temperature < Min -> BREACH ("TEMPERATURE EXCURSION DETECTED")
     *    - Otherwise -> SAFE
     * 3. Age-Verification Security Protocol:
     *    - If verification fails -> Delivery Status is automatically set to "RETURN TO PHARMACY"
     */
    private void applySecurityAndTemperatureProtocols(ColdChainDelivery delivery) {
        // Cold-Chain 2°C to 8°C handling protocol
        if (Boolean.TRUE.equals(delivery.getTemperatureSensitive())) {
            if (delivery.getMinTemperature() == null) {
                delivery.setMinTemperature(2.00);
            }
            if (delivery.getMaxTemperature() == null) {
                delivery.setMaxTemperature(8.00);
            }
        }

        // Temperature Breach Detection
        double min = delivery.getMinTemperature() != null ? delivery.getMinTemperature() : 2.00;
        double max = delivery.getMaxTemperature() != null ? delivery.getMaxTemperature() : 8.00;
        double current = delivery.getCurrentTemperature() != null ? delivery.getCurrentTemperature() : 0.0;

        if (current < min || current > max) {
            delivery.setTemperatureStatus("BREACH");
            // Highlight breach in notes if not already noted
            String warningPrefix = "[TEMPERATURE EXCURSION DETECTED: " + current + "°C outside " + min + "°C-" + max + "°C]";
            if (delivery.getNotes() == null || delivery.getNotes().trim().isEmpty()) {
                delivery.setNotes(warningPrefix);
            } else if (!delivery.getNotes().contains("TEMPERATURE EXCURSION DETECTED")) {
                delivery.setNotes(warningPrefix + " " + delivery.getNotes());
            }
        } else {
            delivery.setTemperatureStatus("SAFE");
        }

        // Age-Verification Security Protocol
        if (Boolean.TRUE.equals(delivery.getAgeVerificationRequired())) {
            if ("Failed".equalsIgnoreCase(delivery.getAgeVerificationStatus())) {
                delivery.setDeliveryStatus("RETURN TO PHARMACY");
                String returnNote = "Age verification failed. Package must be returned to pharmacy.";
                if (delivery.getNotes() == null || delivery.getNotes().trim().isEmpty()) {
                    delivery.setNotes(returnNote);
                } else if (!delivery.getNotes().contains("Package must be returned to pharmacy")) {
                    delivery.setNotes(delivery.getNotes() + " | " + returnNote);
                }
            } else if (delivery.getAgeVerificationStatus() == null || delivery.getAgeVerificationStatus().trim().isEmpty()) {
                delivery.setAgeVerificationStatus("Pending");
            }
        } else {
            delivery.setAgeVerificationStatus("Not Required");
            delivery.setMinimumAge(null);
        }
    }

    /**
     * Validates domain constraints not caught by static DTO annotations:
     * - Minimum temperature must be strictly less than maximum temperature
     * - If age verification is required, minimum age must be provided and > 0
     */
    private void validateBusinessRules(ColdChainRequest request) {
        if (request.getMinTemperature() != null && request.getMaxTemperature() != null) {
            if (request.getMinTemperature() >= request.getMaxTemperature()) {
                throw new IllegalArgumentException("Minimum Temperature (" + request.getMinTemperature() + 
                        "°C) must be strictly less than Maximum Temperature (" + request.getMaxTemperature() + "°C).");
            }
        }

        if (Boolean.TRUE.equals(request.getAgeVerificationRequired())) {
            if (request.getMinimumAge() == null) {
                throw new IllegalArgumentException("Minimum Recipient Age is required when Age Verification is enabled.");
            }
            if (request.getMinimumAge() <= 0) {
                throw new IllegalArgumentException("Minimum Recipient Age must be a positive integer.");
            }
        }
    }

    /**
     * Helper to map DTO fields to the JPA Entity.
     */
    private void mapDtoToEntity(ColdChainRequest req, ColdChainDelivery entity) {
        entity.setOrderId(req.getOrderId().trim());
        entity.setMedicationName(req.getMedicationName().trim());
        entity.setTemperatureSensitive(req.getTemperatureSensitive());
        entity.setMinTemperature(req.getMinTemperature());
        entity.setMaxTemperature(req.getMaxTemperature());
        entity.setCurrentTemperature(req.getCurrentTemperature());
        entity.setAgeVerificationRequired(req.getAgeVerificationRequired());
        entity.setMinimumAge(req.getMinimumAge());
        entity.setCourierName(req.getCourierName().trim());
        entity.setPackageType(req.getPackageType() != null ? req.getPackageType().trim() : "Insulated Cooler Box");
        entity.setDeliveryStatus(req.getDeliveryStatus().trim());
        entity.setAgeVerificationStatus(req.getAgeVerificationStatus());
        entity.setNotes(req.getNotes());
    }

    // ====================================================================
    // TELEMETRY OPERATIONS (Preserved for compatibility)
    // ====================================================================

    @Transactional(readOnly = true)
    public List<ColdChainTelemetry> getAllTelemetry() {
        return telemetryRepository != null ? telemetryRepository.findAll() : List.of();
    }

    @Transactional(readOnly = true)
    public List<ColdChainTelemetry> getTelemetryByDelivery(Long deliveryId) {
        return telemetryRepository != null ? telemetryRepository.findByDeliveryId(deliveryId) : List.of();
    }

    @Transactional(readOnly = true)
    public List<ColdChainTelemetry> getBreachedTelemetry() {
        return telemetryRepository != null ? telemetryRepository.findByBreachFlagTrue() : List.of();
    }

    public ColdChainTelemetry recordTelemetry(ColdChainTelemetryRequest request) {
        if (deliveryRepository == null || telemetryRepository == null) {
            throw new IllegalStateException("Telemetry repositories not configured.");
        }
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
