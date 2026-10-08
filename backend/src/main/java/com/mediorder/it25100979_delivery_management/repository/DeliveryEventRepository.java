package com.mediorder.it25100979_delivery_management.repository;

import com.mediorder.it25100979_delivery_management.model.DeliveryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryEventRepository extends JpaRepository<DeliveryEvent, Long> {
    List<DeliveryEvent> findByDeliveryIdOrderByCreatedAtAsc(Long deliveryId);
}
