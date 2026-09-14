package com.medilink.repository;

import com.medilink.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {

    // PBI-06: FEFO - nearest expiry first, not locked
    List<Batch> findByMedicineIdAndLockedFalseOrderByExpiryDateAsc(Long medicineId);

    // PBI-08: expired but not yet locked
    List<Batch> findByExpiryDateBeforeAndLockedFalse(LocalDate today);

    // PBI-05: real-time stock per medicine
    List<Batch> findByMedicineId(Long medicineId);
}