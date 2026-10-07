package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.model.Delivery;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryService {

    @Autowired
    private DeliveryRepository deliveryRepository;

    public Delivery createDelivery(Delivery delivery) {
        if (delivery.getStatus() == null || delivery.getStatus().trim().isEmpty()) {
            delivery.setStatus("PENDING");
        }
        return deliveryRepository.save(delivery);
    }

    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAll();
    }

    public Delivery updateDeliveryStatus(Long id, String status) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + id));
        if (status != null && !status.trim().isEmpty()) {
            delivery.setStatus(status.trim().toUpperCase());
        }
        return deliveryRepository.save(delivery);
    }

    public void deleteDelivery(Long id) {
        deliveryRepository.deleteById(id);
    }
}


