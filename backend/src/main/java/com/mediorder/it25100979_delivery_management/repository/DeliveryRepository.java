package com.mediorder.it25100979_delivery_management.repository;

import com.mediorder.it25100979_delivery_management.model.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
}


