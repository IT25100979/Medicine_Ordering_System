package com.mediorder.repository;

import com.mediorder.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByIsActiveTrue();
    List<Medicine> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);
}
