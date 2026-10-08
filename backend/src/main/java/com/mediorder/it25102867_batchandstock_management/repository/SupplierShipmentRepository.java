package com.mediorder.it25102867_batchandstock_management.repository;

import com.mediorder.it25102867_batchandstock_management.model.SupplierShipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupplierShipmentRepository extends JpaRepository<SupplierShipment, Long> {
    Optional<SupplierShipment> findByReferenceNo(String referenceNo);
    Page<SupplierShipment> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
