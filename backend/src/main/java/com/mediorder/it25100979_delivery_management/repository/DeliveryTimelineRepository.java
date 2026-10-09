package com.mediorder.it25100979_delivery_management.repository;

import com.mediorder.it25100979_delivery_management.entity.DeliveryTimelineEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryTimelineRepository extends JpaRepository<DeliveryTimelineEntry, Long> {
    List<DeliveryTimelineEntry> findByDeliveryIdOrderByCreatedAtAscIdAsc(Long deliveryId);
}
