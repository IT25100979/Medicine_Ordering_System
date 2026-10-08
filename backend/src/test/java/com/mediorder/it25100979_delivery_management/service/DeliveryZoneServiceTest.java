package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.model.DeliveryZone;
import com.mediorder.it25100979_delivery_management.repository.DeliveryZoneRepository;
import com.mediorder.it25100979_delivery_management.service.DeliveryZoneService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DeliveryZoneServiceTest {

    @InjectMocks
    private DeliveryZoneService deliveryZoneService;

    @Mock
    private DeliveryZoneRepository deliveryZoneRepository;

    private DeliveryZone sampleZone;

    @BeforeEach
    void setUp() {
        sampleZone = new DeliveryZone();
        sampleZone.setId(1L);
        sampleZone.setCity("Colombo 01");
        sampleZone.setPostalCode("0100");
        sampleZone.setIsActive(1);
        sampleZone.setDeliveryFee(5.0);
        sampleZone.setEstimatedDeliveryTime(30);
    }

    @Test
    void testCheckCityByNormalizedCity() {
        when(deliveryZoneRepository.findByNormalizedCity("Colombo 01")).thenReturn(Optional.of(sampleZone));

        Optional<DeliveryZone> result = deliveryZoneService.checkCity("Colombo 01");

        assertTrue(result.isPresent());
        assertEquals("Colombo 01", result.get().getCity());
        assertEquals(1, result.get().getIsActive());
        verify(deliveryZoneRepository, times(1)).findByNormalizedCity("Colombo 01");
    }

    @Test
    void testCheckCityByPostalCode() {
        when(deliveryZoneRepository.findByNormalizedCity("0100")).thenReturn(Optional.empty());
        when(deliveryZoneRepository.findByCityIgnoreCase("0100")).thenReturn(Optional.empty());
        when(deliveryZoneRepository.findByPostalCodeIgnoreCase("0100")).thenReturn(Optional.of(sampleZone));

        Optional<DeliveryZone> result = deliveryZoneService.checkCity("0100");

        assertTrue(result.isPresent());
        assertEquals("0100", result.get().getPostalCode());
    }

    @Test
    void testCheckCityNotFound() {
        when(deliveryZoneRepository.findByNormalizedCity("Atlantis")).thenReturn(Optional.empty());
        when(deliveryZoneRepository.findByCityIgnoreCase("Atlantis")).thenReturn(Optional.empty());
        when(deliveryZoneRepository.findByPostalCodeIgnoreCase("Atlantis")).thenReturn(Optional.empty());
        when(deliveryZoneRepository.findByCityOrPostalCode("Atlantis")).thenReturn(Optional.empty());

        Optional<DeliveryZone> result = deliveryZoneService.checkCity("Atlantis");

        assertFalse(result.isPresent());
    }

    @Test
    void testCheckCityEmptyOrNull() {
        assertTrue(deliveryZoneService.checkCity(null).isEmpty());
        assertTrue(deliveryZoneService.checkCity("   ").isEmpty());
    }

    @Test
    void testCheckCitySmartColomboMatch() {
        DeliveryZone colomboRoute = new DeliveryZone();
        colomboRoute.setId(1L);
        colomboRoute.setCity("Colombo 1 - 5");
        colomboRoute.setPostalCode("0100 - 0500");
        colomboRoute.setIsActive(1);
        colomboRoute.setDeliveryFee(500.0);
        colomboRoute.setEstimatedDeliveryTime(60);

        when(deliveryZoneRepository.findByNormalizedCity("Colombo 03")).thenReturn(Optional.empty());
        when(deliveryZoneRepository.findByCityIgnoreCase("Colombo 03")).thenReturn(Optional.empty());
        when(deliveryZoneRepository.findByPostalCodeIgnoreCase("Colombo 03")).thenReturn(Optional.empty());
        when(deliveryZoneRepository.findByCityOrPostalCode("Colombo 03")).thenReturn(Optional.empty());
        when(deliveryZoneRepository.findAll()).thenReturn(List.of(colomboRoute));

        Optional<DeliveryZone> result = deliveryZoneService.checkCity("Colombo 03");

        assertTrue(result.isPresent());
        assertEquals("Colombo 1 - 5", result.get().getCity());
        assertEquals(500.0, result.get().getDeliveryFee());
    }
}


