package com.mediorder.it25101882_cold_chain_tagging.service;

import com.mediorder.it25101882_cold_chain_tagging.dto.ColdChainRequest;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainDelivery;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ColdChainServiceTest {

    @Mock
    private ColdChainRepository repository;

    @InjectMocks
    private ColdChainService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(repository.save(any(ColdChainDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("Test 1: Safe temperature (2°C - 8°C) sets status to SAFE")
    void testSafeTemperatureProtocol() {
        ColdChainRequest request = new ColdChainRequest();
        request.setOrderId("ORD-2001");
        request.setMedicationName("Insulin Glargine");
        request.setTemperatureSensitive(true);
        request.setMinTemperature(2.0);
        request.setMaxTemperature(8.0);
        request.setCurrentTemperature(5.0); // Inside 2-8 range
        request.setCourierName("Alex Rivera");
        request.setDeliveryStatus("Ready for Delivery");

        ColdChainDelivery result = service.createDelivery(request);

        assertEquals("SAFE", result.getTemperatureStatus());
        assertFalse(result.getNotes() != null && result.getNotes().contains("BREACH"));
    }

    @Test
    @DisplayName("Test 2: Excursion temperature (> 8°C) sets status to BREACH")
    void testTemperatureExcursionBreach() {
        ColdChainRequest request = new ColdChainRequest();
        request.setOrderId("ORD-2002");
        request.setMedicationName("Vaccine Vial");
        request.setTemperatureSensitive(true);
        request.setMinTemperature(2.0);
        request.setMaxTemperature(8.0);
        request.setCurrentTemperature(11.2); // Exceeds safe 8°C
        request.setCourierName("Sarah Miller");
        request.setDeliveryStatus("HOLD");

        ColdChainDelivery result = service.createDelivery(request);

        assertEquals("BREACH", result.getTemperatureStatus());
        assertTrue(result.getNotes().contains("TEMPERATURE EXCURSION DETECTED"));
    }

    @Test
    @DisplayName("Test 3: Failed age-verification forces delivery status to RETURN TO PHARMACY")
    void testAgeVerificationFailureForcesReturnToPharmacy() {
        ColdChainRequest request = new ColdChainRequest();
        request.setOrderId("ORD-2003");
        request.setMedicationName("Controlled Analgesic");
        request.setTemperatureSensitive(true);
        request.setCurrentTemperature(4.5);
        request.setAgeVerificationRequired(true);
        request.setMinimumAge(21);
        request.setAgeVerificationStatus("Failed"); // Underage recipient
        request.setCourierName("Michael Torres");
        request.setDeliveryStatus("Out for Delivery");

        ColdChainDelivery result = service.createDelivery(request);

        assertEquals("RETURN TO PHARMACY", result.getDeliveryStatus());
        assertTrue(result.getNotes().contains("Package must be returned to pharmacy"));
    }

    @Test
    @DisplayName("Test 4: Min temperature >= Max temperature throws IllegalArgumentException")
    void testInvalidTemperatureRange() {
        ColdChainRequest request = new ColdChainRequest();
        request.setOrderId("ORD-2004");
        request.setMedicationName("Invalid Range Drug");
        request.setTemperatureSensitive(true);
        request.setMinTemperature(10.0);
        request.setMaxTemperature(5.0); // Min > Max!
        request.setCurrentTemperature(6.0);
        request.setCourierName("Courier");
        request.setDeliveryStatus("Ready");

        assertThrows(IllegalArgumentException.class, () -> service.createDelivery(request));
    }
}
