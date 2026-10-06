package com.mediorder;

import com.mediorder.model.DeliveryZone;
import com.mediorder.repository.DeliveryZoneRepository;
import com.mediorder.service.DeliveryZoneService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
}
