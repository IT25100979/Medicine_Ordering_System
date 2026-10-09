package com.mediorder.it25100979_delivery_management.repository;

import com.mediorder.it25100979_delivery_management.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    List<Delivery> findByStatusOrderByIdDesc(String status);
    List<Delivery> findByBatchId(String batchId);
    List<Delivery> findByAssignedCourierOrderByIdDesc(String assignedCourier);
    List<Delivery> findAllByOrderByIdDesc();
    List<Delivery> findByUserIdOrderByIdDesc(Long userId);
    Optional<Delivery> findByIdAndUserId(Long id, Long userId);
}
