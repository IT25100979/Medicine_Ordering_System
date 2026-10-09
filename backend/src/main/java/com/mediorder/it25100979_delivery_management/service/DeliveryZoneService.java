package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.dto.request.DeliveryZoneRequest;
import com.mediorder.it25100979_delivery_management.entity.DeliveryZone;
import com.mediorder.it25100979_delivery_management.repository.DeliveryZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
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
        zone = deliveryZoneRepository.findByCityOrPostalCode(trimmed);
        if (zone.isPresent()) {
            return zone;
        }

        // Smart route match for Colombo 1 - 5 geofence coverage
        String normalized = trimmed.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (normalized.matches(".*colombo0?[1-5].*") || normalized.matches(".*0[1-5]00.*") || normalized.contains("colombo")) {
            return deliveryZoneRepository.findAll().stream()
                    .filter(z -> z.getCity() != null && z.getCity().contains("Colombo 1 - 5"))
                    .findFirst();
        }

        return Optional.empty();
    }

    public DeliveryZone createDeliveryZone(DeliveryZoneRequest request) {
        DeliveryZone zone = new DeliveryZone();
        apply(zone, request);
        zone.setCreatedAt(LocalDate.now());
        return deliveryZoneRepository.save(zone);
    }

    public DeliveryZone updateDeliveryZone(Long id, DeliveryZoneRequest request) {
        DeliveryZone zone = requireZone(id);
        apply(zone, request);
        return deliveryZoneRepository.save(zone);
    }

    public DeliveryZone toggleZoneStatus(Long id) {
        DeliveryZone zone = requireZone(id);
        zone.setIsActive(zone.getIsActive() != null && zone.getIsActive() == 1 ? 0 : 1);
        return deliveryZoneRepository.save(zone);
    }

    public void deleteDeliveryZone(Long id) {
        deliveryZoneRepository.delete(requireZone(id));
    }

    private DeliveryZone requireZone(Long id) {
        return deliveryZoneRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery zone not found with id: " + id));
    }

    private void apply(DeliveryZone zone, DeliveryZoneRequest request) {
        zone.setCity(request.getCity().trim());
        zone.setPostalCode(request.getPostalCode().trim());
        zone.setIsActive(request.getIsActive() != null ? request.getIsActive() : 1);
        zone.setDeliveryFee(request.getDeliveryFee());
        Integer minutes = request.getEstimatedDeliveryTime() != null ? request.getEstimatedDeliveryTime() : 60;
        zone.setEstimatedDeliveryTime(minutes);
        zone.setEsitmatedDeliveryTime(minutes);
    }
}
