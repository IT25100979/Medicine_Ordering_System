package com.mediorder.it25102867_batchandstock_management.repository;

import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findAllByOrderByNameAsc();

    List<Medicine> findByNameContainingIgnoreCaseOrGenericNameContainingIgnoreCase(String name, String genericName);

    List<Medicine> findByRequiresPrescription(Boolean requiresPrescription);

    List<Medicine> findByCategoryIgnoreCase(String category);

    Optional<Medicine> findBySku(String sku);

    boolean existsBySku(String sku);

    long countByStockQuantityLessThanEqual(Integer threshold);
}


