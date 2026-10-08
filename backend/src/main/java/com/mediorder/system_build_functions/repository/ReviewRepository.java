package com.mediorder.system_build_functions.repository;

import com.mediorder.system_build_functions.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByMedicineIdAndStatusOrderByCreatedAtDesc(Long medicineId, String status);
    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);
    boolean existsByMedicineIdAndUserId(Long medicineId, Long userId);
}
