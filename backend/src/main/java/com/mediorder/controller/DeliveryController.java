package com.mediorder.controller;

import com.mediorder.model.Delivery;
import com.mediorder.service.DeliveryService;
import com.online_pharmacy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/deliveries", "/api/deliveries"})
@CrossOrigin(origins = "*")
public class DeliveryController {

    @Autowired
    private DeliveryService deliveryService;

    @Autowired(required = false)
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Delivery> createDelivery(@RequestBody Delivery delivery, Authentication authentication) {
        if (delivery.getUserId() == null && authentication != null && userRepository != null) {
            userRepository.findByEmail(authentication.getName())
                    .ifPresent(u -> delivery.setUserId(u.getId()));
        }
        if (delivery.getUserId() == null) {
            delivery.setUserId(1L);
        }
        if (delivery.getStatus() == null || delivery.getStatus().trim().isEmpty()) {
            delivery.setStatus("PENDING");
        }
        return ResponseEntity.ok(deliveryService.createDelivery(delivery));
    }

    @GetMapping
    public ResponseEntity<List<Delivery>> getAllDeliveries() {
        return ResponseEntity.ok(deliveryService.getAllDeliveries());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Delivery> updateDeliveryStatus(@PathVariable Long id, @RequestBody Map<String, String> statusUpdate) {
        String status = statusUpdate != null ? statusUpdate.get("status") : "PENDING";
        return ResponseEntity.ok(deliveryService.updateDeliveryStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDelivery(@PathVariable Long id) {
        deliveryService.deleteDelivery(id);
        return ResponseEntity.noContent().build();
    }
}
