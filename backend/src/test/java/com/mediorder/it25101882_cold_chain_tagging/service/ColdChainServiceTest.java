package com.mediorder.it25101882_cold_chain_tagging.service;

import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainTelemetryRequest;
import com.mediorder.it25101882_cold_chain_tagging.model.*;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTagRepository;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTelemetryRepository;
import com.mediorder.it25100979_delivery_management.model.Delivery;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ColdChainServiceTest {

    @Mock
    private ColdChainTelemetryRepository telemetryRepository;

    @Mock
    private ColdChainTagRepository tagRepository;

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @InjectMocks
    private ColdChainService coldChainService;

    private Medicine testMedicine;
    private Delivery testDelivery;

    @BeforeEach
    void setUp() {
        testMedicine = Medicine.builder()
                .id(1L)
                .name("Insulin Glargine 100 U/mL")
                .sku("SKU-INS-GLA-100")
                .stockQuantity(100)
                .build();

        testDelivery = Delivery.builder()
                .id(10L)
                .customerName("Alice Smith")
                .status("IN_TRANSIT")
                .build();
    }

    @Test
    void testRecordTelemetry_SafeRange_BreachFlagFalse() {
        when(deliveryRepository.findById(10L)).thenReturn(Optional.of(testDelivery));
        when(telemetryRepository.save(any(ColdChainTelemetry.class))).thenAnswer(i -> i.getArgument(0));

        ColdChainTelemetryRequest req = new ColdChainTelemetryRequest();
        req.setDeliveryId(10L);
        req.setDeviceId("SENS-001");
        req.setTemperatureRecorded(new BigDecimal("4.50"));
        req.setHumidityRecorded(new BigDecimal("55.00"));

        ColdChainTelemetry result = coldChainService.recordTelemetry(req);

        assertNotNull(result);
        assertFalse(result.getBreachFlag());
        assertEquals(new BigDecimal("4.50"), result.getTemperatureRecorded());
    }

    @Test
    void testRecordTelemetry_HighTemp_BreachFlagTrue() {
        when(deliveryRepository.findById(10L)).thenReturn(Optional.of(testDelivery));
        when(telemetryRepository.save(any(ColdChainTelemetry.class))).thenAnswer(i -> i.getArgument(0));

        ColdChainTelemetryRequest req = new ColdChainTelemetryRequest();
        req.setDeliveryId(10L);
        req.setDeviceId("SENS-001");
        req.setTemperatureRecorded(new BigDecimal("12.50")); // Exceeds 8.00C

        ColdChainTelemetry result = coldChainService.recordTelemetry(req);

        assertNotNull(result);
        assertTrue(result.getBreachFlag());
    }

    @Test
    void testTagMedicine_Refrigerated_ApprovedDirectly() {
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(testMedicine));
        when(tagRepository.findByMedicineId(1L)).thenReturn(Optional.empty());
        when(tagRepository.save(any(ColdChainTag.class))).thenAnswer(i -> i.getArgument(0));

        ColdChainTag tagReq = ColdChainTag.builder()
                .section(ColdChainSection.REFRIGERATED)
                .storageTempMin(new BigDecimal("2.00"))
                .storageTempMax(new BigDecimal("8.00"))
                .intensity(MedicineIntensity.HIGH)
                .securityLevel(SecurityLevel.TAMPER_EVIDENT)
                .deliveryActions("Pack with EPS thermal cooler box and validated gel packs")
                .build();

        ColdChainTag result = coldChainService.tagMedicine(1L, tagReq, "ops@mediorder.com", "OPERATIONS_MANAGER");

        assertNotNull(result);
        assertEquals(ColdChainSection.REFRIGERATED, result.getSection());
        assertEquals("APPROVED", result.getStatus());
        assertTrue(testMedicine.getIsTemperatureSensitive());
        verify(medicineRepository, times(1)).save(testMedicine);
    }

    @Test
    void testTagMedicine_ControlledVault_RequiresDualReview() {
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(testMedicine));
        when(tagRepository.findByMedicineId(1L)).thenReturn(Optional.empty());
        when(tagRepository.save(any(ColdChainTag.class))).thenAnswer(i -> i.getArgument(0));

        ColdChainTag tagReq = ColdChainTag.builder()
                .section(ColdChainSection.CONTROLLED_VAULT)
                .intensity(MedicineIntensity.CRITICAL)
                .securityLevel(SecurityLevel.CONTROLLED_SUBSTANCE)
                .build();

        ColdChainTag result = coldChainService.tagMedicine(1L, tagReq, "ops@mediorder.com", "OPERATIONS_MANAGER");

        assertNotNull(result);
        assertEquals("PENDING_DUAL_REVIEW", result.getStatus());
    }

    @Test
    void testGetCanonicalSectionMetadata_Returns5Sections() {
        List<Map<String, Object>> sections = coldChainService.getCanonicalSectionMetadata();
        assertEquals(5, sections.size());
        assertTrue(sections.stream().anyMatch(s -> "AMBIENT".equals(s.get("section"))));
        assertTrue(sections.stream().anyMatch(s -> "COOL_ROOM".equals(s.get("section"))));
        assertTrue(sections.stream().anyMatch(s -> "REFRIGERATED".equals(s.get("section"))));
        assertTrue(sections.stream().anyMatch(s -> "FROZEN".equals(s.get("section"))));
        assertTrue(sections.stream().anyMatch(s -> "CONTROLLED_VAULT".equals(s.get("section"))));
    }
}
