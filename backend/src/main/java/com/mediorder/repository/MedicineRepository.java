package com.mediorder.repository;

import com.mediorder.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findAllByOrderByNameAsc();

    List<Medicine> findByNameContainingIgnoreCaseOrGenericNameContainingIgnoreCase(String name, String genericName);

    List<Medicine> findByRequiresPrescription(Boolean requiresPrescription);

    Optional<Medicine> findBySku(String sku);
}
