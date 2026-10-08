package com.mediorder.it25101923_prescription_management.repository;
import com.mediorder.it25101923_prescription_management.model.PrescriptionUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PrescriptionUsageRepository extends JpaRepository<PrescriptionUsage,Long> {
    boolean existsByPrescriptionIdAndOrderId(Long rx,Long order);
    List<PrescriptionUsage> findByPrescriptionIdOrderByCreatedAtDesc(Long id);
}
