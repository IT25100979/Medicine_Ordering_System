package com.mediorder.it25101882_cold_chain_tagging.service;

import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainTelemetryRequest;
import com.mediorder.it25101882_cold_chain_tagging.model.*;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTagRepository;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTelemetryRepository;
import com.mediorder.it25100979_delivery_management.model.Delivery;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.system_build_functions.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class ColdChainService {

    @Autowired
    private ColdChainTelemetryRepository telemetryRepository;

    @Autowired
    private ColdChainTagRepository tagRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired(required = false)
    private AuditService auditService;

    private static final BigDecimal MIN_SAFE_TEMP = new BigDecimal("2.00");
    private static final BigDecimal MAX_SAFE_TEMP = new BigDecimal("8.00");

    // ==========================================
    // Telemetry Operations
    // ==========================================

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
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found with id: " + request.getDeliveryId());
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

        ColdChainTelemetry saved = telemetryRepository.save(telemetry);

        if (isBreached && auditService != null) {
            auditService.logAction("TEMPERATURE_BREACH_DETECTED", "Delivery", String.valueOf(request.getDeliveryId()),
                    "Temp: " + request.getTemperatureRecorded() + "C", "ALERT_TRIGGERED");
        }

        return saved;
    }

    // ==========================================
    // Cold Chain Tagging Operations
    // ==========================================

    @Transactional(readOnly = true)
    public List<ColdChainTag> getAllTags() {
        return tagRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<ColdChainTag> getTagByMedicineId(Long medicineId) {
        return tagRepository.findByMedicineId(medicineId);
    }

    public ColdChainTag tagMedicine(Long medicineId, ColdChainTag tagRequest, String actorEmail, String actorRole) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found with id: " + medicineId));

        ColdChainTag existing = tagRepository.findByMedicineId(medicineId).orElse(null);
        String beforeState = existing != null ? existing.getSection().name() : "NONE";

        if (existing == null) {
            existing = new ColdChainTag();
            existing.setMedicine(medicine);
        }

        ColdChainSection section = tagRequest.getSection() != null ? tagRequest.getSection() : ColdChainSection.AMBIENT;
        existing.setSection(section);
        existing.setStorageTempMin(tagRequest.getStorageTempMin());
        existing.setStorageTempMax(tagRequest.getStorageTempMax());
        existing.setShelfLifeDays(tagRequest.getShelfLifeDays() != null ? tagRequest.getShelfLifeDays() : 730);
        existing.setIntensity(tagRequest.getIntensity() != null ? tagRequest.getIntensity() : MedicineIntensity.LOW);
        existing.setSecurityLevel(tagRequest.getSecurityLevel() != null ? tagRequest.getSecurityLevel() : SecurityLevel.STANDARD);
        existing.setDeliveryActions(tagRequest.getDeliveryActions());

        // High security / frozen / controlled vault requires dual approval
        if (section == ColdChainSection.CONTROLLED_VAULT || section == ColdChainSection.FROZEN || existing.getIntensity() == MedicineIntensity.CRITICAL) {
            existing.setStatus("PENDING_DUAL_REVIEW");
            existing.setReviewedBy(actorEmail);
            existing.setReviewedAt(LocalDateTime.now());
        } else {
            existing.setStatus("APPROVED");
            existing.setReviewedBy(actorEmail);
            existing.setReviewedAt(LocalDateTime.now());
        }

        // Sync temperature sensitivity on Medicine entity
        boolean isTempSensitive = (section != ColdChainSection.AMBIENT);
        medicine.setIsTemperatureSensitive(isTempSensitive);
        if (existing.getStorageTempMin() != null) medicine.setMinTemp(existing.getStorageTempMin());
        if (existing.getStorageTempMax() != null) medicine.setMaxTemp(existing.getStorageTempMax());
        medicineRepository.save(medicine);

        ColdChainTag saved = tagRepository.save(existing);

        if (auditService != null) {
            auditService.logAction("TAG_MEDICINE_COLD_CHAIN", "ColdChainTag", String.valueOf(saved.getId()),
                    beforeState, "Section: " + saved.getSection().name() + " (" + saved.getStatus() + ")");
        }

        return saved;
    }

    public ColdChainTag reviewTag(Long tagId, String action, String reviewerEmail, String reviewerRole) {
        ColdChainTag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ColdChainTag not found with id: " + tagId));

        String beforeState = tag.getStatus();

        if ("APPROVE".equalsIgnoreCase(action)) {
            tag.setStatus("APPROVED");
            tag.setDualConfirmedBy(reviewerEmail);
        } else if ("REJECT".equalsIgnoreCase(action)) {
            tag.setStatus("REJECTED");
            tag.setDualConfirmedBy(reviewerEmail);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported review action: " + action + ". Use APPROVE or REJECT.");
        }

        tag.setUpdatedAt(LocalDateTime.now());
        ColdChainTag saved = tagRepository.save(tag);

        if (auditService != null) {
            auditService.logAction("DUAL_REVIEW_COLD_CHAIN_TAG", "ColdChainTag", String.valueOf(tagId),
                    beforeState, saved.getStatus() + " by " + reviewerEmail + " (" + reviewerRole + ")");
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCanonicalSectionMetadata() {
        List<Map<String, Object>> sections = new ArrayList<>();

        Map<String, Object> ambient = new HashMap<>();
        ambient.put("section", ColdChainSection.AMBIENT.name());
        ambient.put("displayName", "Ambient Storage");
        ambient.put("tempRange", "15°C to 25°C");
        ambient.put("tempMin", 15.0);
        ambient.put("tempMax", 25.0);
        ambient.put("description", "Standard controlled room temperature for oral tablets, capsules, dry syrups, and non-sensitive OTC wellness products.");
        ambient.put("packagingProtocol", "Standard corrugated cardboard box or bubble mailer.");
        ambient.put("securityLevel", "STANDARD");
        sections.add(ambient);

        Map<String, Object> coolRoom = new HashMap<>();
        coolRoom.put("section", ColdChainSection.COOL_ROOM.name());
        coolRoom.put("displayName", "Cool Room Storage");
        coolRoom.put("tempRange", "8°C to 15°C");
        coolRoom.put("tempMin", 8.0);
        coolRoom.put("tempMax", 15.0);
        coolRoom.put("description", "Dedicated cool-zone storage for sensitive liquid suspensions, specialized dermal ointments, and ophthalmic drops.");
        coolRoom.put("packagingProtocol", "Thermal insulated bubble wrap with single cold pad.");
        coolRoom.put("securityLevel", "STANDARD");
        sections.add(coolRoom);

        Map<String, Object> refrigerated = new HashMap<>();
        refrigerated.put("section", ColdChainSection.REFRIGERATED.name());
        refrigerated.put("displayName", "Refrigerated Cold Chain");
        refrigerated.put("tempRange", "2°C to 8°C");
        refrigerated.put("tempMin", 2.0);
        refrigerated.put("tempMax", 8.0);
        refrigerated.put("description", "Strict 2-8°C refrigerated storage for insulin pens, biologics, vaccines, monoclonal antibodies, and reconstituted antibiotics.");
        refrigerated.put("packagingProtocol", "Expanded Polystyrene (EPS) thermal cooler box, validated gel ice packs, and continuous digital temperature logger.");
        refrigerated.put("securityLevel", "TAMPER_EVIDENT");
        sections.add(refrigerated);

        Map<String, Object> frozen = new HashMap<>();
        frozen.put("section", ColdChainSection.FROZEN.name());
        frozen.put("displayName", "Deep Frozen Storage");
        frozen.put("tempRange", "-25°C to -10°C");
        frozen.put("tempMin", -25.0);
        frozen.put("tempMax", -10.0);
        frozen.put("description", "Ultra-low sub-zero temperature storage for cryo-preservatives, specialized mRNA vaccines, and laboratory biologicals.");
        frozen.put("packagingProtocol", "Vacuum-insulated panel (VIP) shipper with dry ice or phase change material (PCM). Dual sign-off required.");
        frozen.put("securityLevel", "LOCKED");
        sections.add(frozen);

        Map<String, Object> vault = new HashMap<>();
        vault.put("section", ColdChainSection.CONTROLLED_VAULT.name());
        vault.put("displayName", "Controlled / Secured Vault");
        vault.put("tempRange", "15°C to 25°C (Locked)");
        vault.put("tempMin", 15.0);
        vault.put("tempMax", 25.0);
        vault.put("description", "High-security double-locked biometric vault for Schedule II-V controlled narcotics, opioids, and high-potency regulated substances.");
        vault.put("packagingProtocol", "Tamper-evident serial-numbered security bag, dual pharmacist verification seal, chain-of-custody tracking.");
        vault.put("securityLevel", "CONTROLLED_SUBSTANCE");
        sections.add(vault);

        return sections;
    }
}
