package com.mediorder.it25101923_prescription_management.repository;
import com.mediorder.it25101923_prescription_management.model.PrescriptionAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PrescriptionAuditRepository extends JpaRepository<PrescriptionAudit,Long> {
    List<PrescriptionAudit> findByPrescriptionIdOrderByCreatedAtAscIdAsc(Long id);
}
