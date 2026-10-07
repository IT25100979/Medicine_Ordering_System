package com.mediorder.it25100979_delivery_management.controller;

import com.mediorder.it25100979_delivery_management.model.DeliveryZone;
import com.mediorder.it25100979_delivery_management.service.DeliveryZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping({"/api/v1/delivery-zones", "/api/delivery-zones"})
@CrossOrigin(origins = "*")
public class DeliveryZoneController {

    @Autowired
    private DeliveryZoneService deliveryZoneService;

    @GetMapping
    public ResponseEntity<List<DeliveryZone>> getAllDeliveryZones() {
        return ResponseEntity.ok(deliveryZoneService.getAllDeliveryZones());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeliveryZone> getDeliveryZoneById(@PathVariable Long id) {
        return deliveryZoneService.getDeliveryZoneById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkDeliveryZone(@RequestParam(value = "city", required = false) String city) {
        Map<String, Object> response = new HashMap<>();

        if (city == null || city.trim().isEmpty()) {
            response.put("found", false);
            response.put("available", false);
            response.put("is_active", 0);
            response.put("city", "");
            response.put("message", "City not available");
            return ResponseEntity.ok(response);
        }

        Optional<DeliveryZone> zoneOpt = deliveryZoneService.checkCity(city);
        if (zoneOpt.isPresent()) {
            DeliveryZone zone = zoneOpt.get();
            boolean isAvailable = (zone.getIsActive() != null && zone.getIsActive() == 1);
            response.put("found", true);
            response.put("id", zone.getId());
            response.put("city", zone.getCity());
            response.put("postal_code", zone.getPostalCode());
            response.put("is_active", zone.getIsActive());
            response.put("delivery_fee", zone.getDeliveryFee());
            response.put("estimated_delivery_time", zone.getEstimatedDeliveryTime());
            response.put("esitmated_delivery_time", zone.getEsitmatedDeliveryTime());
            response.put("created_at", zone.getCreatedAt());
            response.put("available", isAvailable);
            response.put("message", isAvailable ? "City available" : "City not available");
            return ResponseEntity.ok(response);
        } else {
            response.put("found", false);
            response.put("city", city.trim());
            response.put("available", false);
            response.put("is_active", 0);
            response.put("message", "City not available");
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping
    public ResponseEntity<DeliveryZone> createDeliveryZone(@RequestBody DeliveryZone zone) {
        return ResponseEntity.ok(deliveryZoneService.saveDeliveryZone(zone));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeliveryZone> updateDeliveryZone(@PathVariable Long id, @RequestBody DeliveryZone zone) {
        return ResponseEntity.ok(deliveryZoneService.updateDeliveryZone(id, zone));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<DeliveryZone> toggleZoneStatus(@PathVariable Long id) {
        DeliveryZone zone = deliveryZoneService.getDeliveryZoneById(id)
                .orElseThrow(() -> new RuntimeException("Zone not found with id: " + id));
        int newStatus = (zone.getIsActive() != null && zone.getIsActive() == 1) ? 0 : 1;
        zone.setIsActive(newStatus);
        return ResponseEntity.ok(deliveryZoneService.saveDeliveryZone(zone));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeliveryZone(@PathVariable Long id) {
        deliveryZoneService.deleteDeliveryZone(id);
        return ResponseEntity.noContent().build();
    }
}


