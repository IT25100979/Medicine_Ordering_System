package com.mediorder.it25101882_cold_chain_tagging.service;

import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainTelemetryRequest;
import com.mediorder.it25101882_cold_chain_tagging.model.*;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTagRepository;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTelemetryRepository;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
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

    @Autowired(required = false)
    private com.mediorder.system_build_functions.service.RealtimeService realtimeService;

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

    @Autowired
    private com.mediorder.it25102867_batchandstock_management.repository.InventoryBatchRepository inventoryBatchRepository;

    public ColdChainTag tagMedicine(Long medicineId, ColdChainTag tagRequest, String actorEmail, String actorRole) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found with id: " + medicineId));

        ColdChainTag existing = tagRepository.findByMedicineId(medicineId).orElse(null);
        String beforeState = existing != null ? existing.getSection().name() : "NONE";

        if (existing == null) {
            existing = new ColdChainTag();
            existing.setMedicine(medicine);
        }

        ColdChainSection section = (tagRequest != null && tagRequest.getSection() != null) ? tagRequest.getSection() : ColdChainSection.AMBIENT;
        existing.setSection(section);
        if (tagRequest != null) {
            existing.setStorageTempMin(tagRequest.getStorageTempMin());
            existing.setStorageTempMax(tagRequest.getStorageTempMax());
            existing.setShelfLifeDays(tagRequest.getShelfLifeDays() != null ? tagRequest.getShelfLifeDays() : 730);
            existing.setIntensity(tagRequest.getIntensity() != null ? tagRequest.getIntensity() : MedicineIntensity.LOW);
            existing.setSecurityLevel(tagRequest.getSecurityLevel() != null ? tagRequest.getSecurityLevel() : SecurityLevel.STANDARD);
            existing.setDeliveryActions(tagRequest.getDeliveryActions());
        }

        String targetStatus = (tagRequest != null && tagRequest.getStatus() != null && !tagRequest.getStatus().trim().isEmpty())
                ? tagRequest.getStatus()
                : "APPROVED";

        existing.setStatus(targetStatus);
        existing.setReviewedBy(actorEmail);
        existing.setReviewedAt(LocalDateTime.now());
        existing.setUpdatedAt(LocalDateTime.now());

        // Sync temperature sensitivity and storage on Medicine entity
        boolean isTempSensitive = (section != ColdChainSection.AMBIENT);
        medicine.setIsTemperatureSensitive(isTempSensitive);
        medicine.setColdChainStatus(existing.getStatus());
        if (existing.getStorageTempMin() != null) medicine.setMinTemp(existing.getStorageTempMin());
        if (existing.getStorageTempMax() != null) medicine.setMaxTemp(existing.getStorageTempMax());

        // Set storageRequirement based on canonical tags
        if (section == ColdChainSection.AMBIENT) {
            medicine.setStorageRequirement("Room Temperature (15°C - 25°C)");
        } else if (section == ColdChainSection.COOL_ROOM) {
            medicine.setStorageRequirement("Cool Room (8°C - 15°C)");
        } else if (section == ColdChainSection.REFRIGERATED) {
            medicine.setStorageRequirement("Cold Chain (2°C - 8°C)");
        } else {
            medicine.setStorageRequirement(section.name().replace("_", " ") + " (" + existing.getStorageTempMin() + "°C - " + existing.getStorageTempMax() + "°C)");
        }
        medicine.setShelfLocation(section.name().replace("_", " ") + " / Aisle " + (char) ('A' + (medicine.getId() % 5)));

        // Sync Description if provided in tagRequest
        if (tagRequest != null && tagRequest.getDescription() != null) {
            medicine.setDescription(tagRequest.getDescription());
        }

        medicineRepository.save(medicine);

        // If approved, transition any pending batches to LIVE
        if ("APPROVED".equalsIgnoreCase(existing.getStatus()) && inventoryBatchRepository != null) {
            List<com.mediorder.it25102867_batchandstock_management.model.InventoryBatch> batches =
                    inventoryBatchRepository.findByMedicineId(medicineId);
            for (var b : batches) {
                if (b.getStatus() == com.mediorder.it25102867_batchandstock_management.model.BatchStatus.COLD_CHAIN_REVIEW ||
                    b.getStatus() == com.mediorder.it25102867_batchandstock_management.model.BatchStatus.QC_PENDING) {
                    b.setStatus(com.mediorder.it25102867_batchandstock_management.model.BatchStatus.LIVE);
                    b.setQcPassedBy(actorEmail);
                    inventoryBatchRepository.save(b);
                }
            }
        }

        ColdChainTag saved = tagRepository.save(existing);

        if (auditService != null) {
            auditService.logAction("TAG_MEDICINE_COLD_CHAIN", "ColdChainTag", String.valueOf(saved.getId()),
                    beforeState, "Section: " + saved.getSection().name() + " (" + saved.getStatus() + ")");
        }

        if (realtimeService != null) {
            realtimeService.publish("cold_chain", "COLD_CHAIN_UPDATED", Map.of(
                    "medicineId", medicineId,
                    "medicineName", medicine.getName(),
                    "status", saved.getStatus(),
                    "section", saved.getSection().name(),
                    "sku", medicine.getSku() != null ? medicine.getSku() : ""
            ));
        }

        return saved;
    }

    public ColdChainTag requestApproval(Long medicineId, ColdChainTag tagRequest, String actorEmail, String actorRole) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found with id: " + medicineId));

        ColdChainTag tag = tagRepository.findByMedicineId(medicineId).orElse(null);
        String beforeState = tag != null ? tag.getStatus() : "NONE";

        if (tag == null) {
            tag = new ColdChainTag();
            tag.setMedicine(medicine);
            tag.setSection(tagRequest != null && tagRequest.getSection() != null ? tagRequest.getSection() : ColdChainSection.REFRIGERATED);
            tag.setStorageTempMin(tagRequest != null && tagRequest.getStorageTempMin() != null ? tagRequest.getStorageTempMin() : new BigDecimal("2.00"));
            tag.setStorageTempMax(tagRequest != null && tagRequest.getStorageTempMax() != null ? tagRequest.getStorageTempMax() : new BigDecimal("8.00"));
            tag.setShelfLifeDays(tagRequest != null && tagRequest.getShelfLifeDays() != null ? tagRequest.getShelfLifeDays() : 730);
            tag.setIntensity(tagRequest != null && tagRequest.getIntensity() != null ? tagRequest.getIntensity() : MedicineIntensity.HIGH);
            tag.setSecurityLevel(tagRequest != null && tagRequest.getSecurityLevel() != null ? tagRequest.getSecurityLevel() : SecurityLevel.LOCKED);
            tag.setDeliveryActions(tagRequest != null && tagRequest.getDeliveryActions() != null ? tagRequest.getDeliveryActions() : "Keep refrigerated (2-8°C). Real-time cold chain monitoring enabled.");
        } else {
            if (tagRequest != null) {
                if (tagRequest.getSection() != null) tag.setSection(tagRequest.getSection());
                if (tagRequest.getStorageTempMin() != null) tag.setStorageTempMin(tagRequest.getStorageTempMin());
                if (tagRequest.getStorageTempMax() != null) tag.setStorageTempMax(tagRequest.getStorageTempMax());
                if (tagRequest.getShelfLifeDays() != null) tag.setShelfLifeDays(tagRequest.getShelfLifeDays());
                if (tagRequest.getIntensity() != null) tag.setIntensity(tagRequest.getIntensity());
                if (tagRequest.getSecurityLevel() != null) tag.setSecurityLevel(tagRequest.getSecurityLevel());
                if (tagRequest.getDeliveryActions() != null) tag.setDeliveryActions(tagRequest.getDeliveryActions());
            } else if (tag.getSection() == ColdChainSection.AMBIENT) {
                tag.setSection(ColdChainSection.REFRIGERATED);
                tag.setStorageTempMin(new BigDecimal("2.00"));
                tag.setStorageTempMax(new BigDecimal("8.00"));
            }
        }

        tag.setStatus("PENDING_REVIEW");
        tag.setReviewedBy(actorEmail);
        tag.setReviewedAt(LocalDateTime.now());
        tag.setUpdatedAt(LocalDateTime.now());

        // Update medicine entity
        medicine.setIsTemperatureSensitive(true);
        medicine.setColdChainStatus("PENDING_REVIEW");
        if (tag.getStorageTempMin() != null) medicine.setMinTemp(tag.getStorageTempMin());
        if (tag.getStorageTempMax() != null) medicine.setMaxTemp(tag.getStorageTempMax());
        medicine.setStorageRequirement("Cold Chain (" + tag.getStorageTempMin() + "°C - " + tag.getStorageTempMax() + "°C)");
        medicineRepository.save(medicine);

        ColdChainTag saved = tagRepository.save(tag);

        if (auditService != null) {
            auditService.logAction("REQUEST_COLD_CHAIN_APPROVAL", "ColdChainTag", String.valueOf(saved.getId()),
                    beforeState, "Requested by " + actorEmail + " (" + actorRole + ") for " + medicine.getName() + " [SKU: " + medicine.getSku() + "]");
        }

        if (realtimeService != null) {
            realtimeService.publish("cold_chain", "COLD_CHAIN_APPROVAL_REQUESTED", Map.of(
                    "medicineId", medicineId,
                    "medicineName", medicine.getName(),
                    "status", saved.getStatus(),
                    "section", saved.getSection().name(),
                    "sku", medicine.getSku() != null ? medicine.getSku() : ""
            ));
        }

        return saved;
    }

    public ColdChainTag moveShelfSection(Long tagId, ColdChainSection targetSection, String actorEmail, String actorRole) {
        ColdChainTag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ColdChainTag not found with id: " + tagId));

        ColdChainSection beforeSection = tag.getSection();
        tag.setSection(targetSection != null ? targetSection : ColdChainSection.AMBIENT);
        tag.setUpdatedAt(LocalDateTime.now());

        // Update default temperature ranges for section if not explicitly locked
        if (targetSection == ColdChainSection.REFRIGERATED) {
            tag.setStorageTempMin(new BigDecimal("2.00"));
            tag.setStorageTempMax(new BigDecimal("8.00"));
        } else if (targetSection == ColdChainSection.COOL_ROOM) {
            tag.setStorageTempMin(new BigDecimal("8.00"));
            tag.setStorageTempMax(new BigDecimal("15.00"));
        } else if (targetSection == ColdChainSection.FROZEN) {
            tag.setStorageTempMin(new BigDecimal("-25.00"));
            tag.setStorageTempMax(new BigDecimal("-10.00"));
        } else {
            tag.setStorageTempMin(new BigDecimal("15.00"));
            tag.setStorageTempMax(new BigDecimal("25.00"));
        }

        Medicine medicine = tag.getMedicine();
        if (medicine != null) {
            boolean isTempSensitive = (targetSection != ColdChainSection.AMBIENT);
            medicine.setIsTemperatureSensitive(isTempSensitive);
            medicine.setMinTemp(tag.getStorageTempMin());
            medicine.setMaxTemp(tag.getStorageTempMax());
            medicine.setStorageRequirement(targetSection.name().replace("_", " ") + " (" + tag.getStorageTempMin() + "°C - " + tag.getStorageTempMax() + "°C)");
            medicine.setShelfLocation(targetSection.name().replace("_", " ") + " / Bay " + ((medicine.getId() % 6) + 1));
            medicineRepository.save(medicine);
        }

        ColdChainTag saved = tagRepository.save(tag);

        if (auditService != null) {
            auditService.logAction("MOVE_SHELF_SECTION", "ColdChainTag", String.valueOf(tagId),
                    beforeSection != null ? beforeSection.name() : "NONE",
                    "Moved to " + targetSection.name() + " by " + actorEmail + " (" + actorRole + ")");
        }

        return saved;
    }

    public ColdChainTag dualConfirmTag(Long tagId, String secondReviewer, String notes, String primaryActor) {
        ColdChainTag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ColdChainTag not found with id: " + tagId));

        String beforeStatus = tag.getStatus();
        tag.setStatus("APPROVED");
        tag.setDualConfirmedBy(secondReviewer != null && !secondReviewer.trim().isEmpty() ? secondReviewer : primaryActor);
        tag.setReviewedBy(primaryActor);
        tag.setReviewedAt(LocalDateTime.now());
        tag.setUpdatedAt(LocalDateTime.now());

        // If batch exists, set status to LIVE
        if (tag.getMedicine() != null && inventoryBatchRepository != null) {
            List<com.mediorder.it25102867_batchandstock_management.model.InventoryBatch> batches =
                    inventoryBatchRepository.findByMedicineId(tag.getMedicine().getId());
            for (var b : batches) {
                b.setStatus(com.mediorder.it25102867_batchandstock_management.model.BatchStatus.LIVE);
                b.setQcPassedBy(secondReviewer);
                inventoryBatchRepository.save(b);
            }
        }

        if (tag.getMedicine() != null) {
            Medicine med = tag.getMedicine();
            med.setColdChainStatus("APPROVED");
            med.setIsTemperatureSensitive(true);
            medicineRepository.save(med);
        }

        ColdChainTag saved = tagRepository.save(tag);

        if (auditService != null) {
            auditService.logAction("DUAL_CONFIRM_COLD_CHAIN_TAG", "ColdChainTag", String.valueOf(tagId),
                    beforeStatus, "APPROVED by Dual Reviewer: " + secondReviewer + " (Reason: " + notes + ")");
        }

        return saved;
    }

    public ColdChainTag reviewTag(Long tagId, String action, String reviewerEmail, String reviewerRole) {
        return reviewTag(tagId, action, null, reviewerEmail, reviewerRole);
    }

    public ColdChainTag reviewTag(Long tagId, String action, String description, String reviewerEmail, String reviewerRole) {
        ColdChainTag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ColdChainTag not found with id: " + tagId));

        String beforeState = tag.getStatus();

        if ("APPROVE".equalsIgnoreCase(action)) {
            tag.setStatus("APPROVED");
            tag.setDualConfirmedBy(reviewerEmail);
            tag.setReviewedBy(reviewerEmail);
            tag.setReviewedAt(LocalDateTime.now());

            // Make batches LIVE
            if (tag.getMedicine() != null && inventoryBatchRepository != null) {
                List<com.mediorder.it25102867_batchandstock_management.model.InventoryBatch> batches =
                        inventoryBatchRepository.findByMedicineId(tag.getMedicine().getId());
                for (var b : batches) {
                    b.setStatus(com.mediorder.it25102867_batchandstock_management.model.BatchStatus.LIVE);
                    b.setQcPassedBy(reviewerEmail);
                    inventoryBatchRepository.save(b);
                }
            }
        } else if ("REJECT".equalsIgnoreCase(action)) {
            tag.setStatus("REJECTED");
            tag.setDualConfirmedBy(reviewerEmail);
            tag.setReviewedBy(reviewerEmail);
            tag.setReviewedAt(LocalDateTime.now());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported review action: " + action + ". Use APPROVE or REJECT.");
        }

        tag.setUpdatedAt(LocalDateTime.now());

        if (tag.getMedicine() != null) {
            Medicine med = tag.getMedicine();
            med.setColdChainStatus(tag.getStatus());
            if ("REJECTED".equalsIgnoreCase(tag.getStatus())) {
                med.setIsTemperatureSensitive(false);
            } else if ("APPROVED".equalsIgnoreCase(tag.getStatus())) {
                med.setIsTemperatureSensitive(true);
            }
            if (description != null && !description.trim().isEmpty()) {
                med.setDescription(description.trim());
            }
            medicineRepository.save(med);
        }

        ColdChainTag saved = tagRepository.save(tag);

        if (auditService != null) {
            auditService.logAction("DUAL_REVIEW_COLD_CHAIN_TAG", "ColdChainTag", String.valueOf(tagId),
                    beforeState, saved.getStatus() + " by " + reviewerEmail + " (" + reviewerRole + ")");
        }

        if (realtimeService != null) {
            realtimeService.publish("cold_chain", "COLD_CHAIN_REVIEWED", Map.of(
                    "tagId", tagId,
                    "action", action,
                    "status", saved.getStatus(),
                    "medicineId", saved.getMedicine() != null ? saved.getMedicine().getId() : 0L
            ));
        }

        return saved;
    }

    public ColdChainTag reviewTagByMedicine(Long medicineId, String action, String description, String reviewerEmail, String reviewerRole) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found with id: " + medicineId));

        ColdChainTag tag = tagRepository.findByMedicineId(medicineId).orElse(null);
        if (tag == null) {
            tag = new ColdChainTag();
            tag.setMedicine(medicine);
            tag.setSection(medicine.getIsTemperatureSensitive() ? ColdChainSection.REFRIGERATED : ColdChainSection.AMBIENT);
            tag.setStorageTempMin(medicine.getMinTemp() != null ? medicine.getMinTemp() : new BigDecimal("2.00"));
            tag.setStorageTempMax(medicine.getMaxTemp() != null ? medicine.getMaxTemp() : new BigDecimal("8.00"));
            tag.setShelfLifeDays(730);
            tag.setIntensity(MedicineIntensity.LOW);
            tag.setSecurityLevel(SecurityLevel.STANDARD);
            tag.setDeliveryActions("Validated storage parameters.");
            tag = tagRepository.save(tag);
        }

        return reviewTag(tag.getId(), action, description, reviewerEmail, reviewerRole);
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
