package com.mediorder.service;

import com.mediorder.model.DeliveryZone;
import com.mediorder.repository.DeliveryZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DeliveryZoneService {

    @Autowired
    private DeliveryZoneRepository deliveryZoneRepository;

    public List<DeliveryZone> getAllDeliveryZones() {
        return deliveryZoneRepository.findAll();
    }

    public Optional<DeliveryZone> getDeliveryZoneById(Long id) {
        return deliveryZoneRepository.findById(id);
    }

    public Optional<DeliveryZone> checkCity(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Optional.empty();
        }
        String trimmed = query.trim();
        Optional<DeliveryZone> zone = deliveryZoneRepository.findByNormalizedCity(trimmed);
        if (zone.isPresent()) {
            return zone;
        }
        zone = deliveryZoneRepository.findByCityIgnoreCase(trimmed);
        if (zone.isPresent()) {
            return zone;
        }
        zone = deliveryZoneRepository.findByPostalCodeIgnoreCase(trimmed);
        if (zone.isPresent()) {
            return zone;
        }
        return deliveryZoneRepository.findByCityOrPostalCode(trimmed);
    }

    public DeliveryZone saveDeliveryZone(DeliveryZone zone) {
        if (zone.getCreatedAt() == null) {
            zone.setCreatedAt(LocalDate.now());
        }
        if (zone.getIsActive() == null) {
            zone.setIsActive(1);
        }
        if (zone.getDeliveryFee() == null) {
            zone.setDeliveryFee(0.0);
        }
        if (zone.getEstimatedDeliveryTime() != null && zone.getEsitmatedDeliveryTime() == null) {
            zone.setEsitmatedDeliveryTime(zone.getEstimatedDeliveryTime());
        } else if (zone.getEsitmatedDeliveryTime() != null && zone.getEstimatedDeliveryTime() == null) {
            zone.setEstimatedDeliveryTime(zone.getEsitmatedDeliveryTime());
        }
        return deliveryZoneRepository.save(zone);
    }

    public DeliveryZone updateDeliveryZone(Long id, DeliveryZone updated) {
        DeliveryZone zone = deliveryZoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery zone not found with id: " + id));

        if (updated.getCity() != null && !updated.getCity().trim().isEmpty()) {
            zone.setCity(updated.getCity().trim());
        }
        if (updated.getPostalCode() != null && !updated.getPostalCode().trim().isEmpty()) {
            zone.setPostalCode(updated.getPostalCode().trim());
        }
        if (updated.getIsActive() != null) {
            zone.setIsActive(updated.getIsActive());
        }
        if (updated.getDeliveryFee() != null) {
            zone.setDeliveryFee(updated.getDeliveryFee());
        }
        if (updated.getEstimatedDeliveryTime() != null) {
            zone.setEstimatedDeliveryTime(updated.getEstimatedDeliveryTime());
            zone.setEsitmatedDeliveryTime(updated.getEstimatedDeliveryTime());
        } else if (updated.getEsitmatedDeliveryTime() != null) {
            zone.setEstimatedDeliveryTime(updated.getEsitmatedDeliveryTime());
            zone.setEsitmatedDeliveryTime(updated.getEsitmatedDeliveryTime());
        }
        if (updated.getCreatedAt() != null) {
            zone.setCreatedAt(updated.getCreatedAt());
        }

        return deliveryZoneRepository.save(zone);
    }

    public void deleteDeliveryZone(Long id) {
        deliveryZoneRepository.deleteById(id);
    }
}
