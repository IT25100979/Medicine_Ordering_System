package com.mediorder.it25100979_delivery_management.repository;

import com.mediorder.it25100979_delivery_management.model.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    List<Delivery> findByStatus(String status);
    List<Delivery> findByBatchId(String batchId);
    List<Delivery> findByAssignedCourier(String assignedCourier);
    List<Delivery> findByAssignedRoute(String assignedRoute);
    List<Delivery> findAllByOrderByIdDesc();
}
