package com.mediorder.it25101923_prescription_management.repository;

import com.mediorder.it25101923_prescription_management.model.Prescription;
import com.mediorder.it25101923_prescription_management.model.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findAllByOrderByCreatedAtDesc();

    List<Prescription> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Prescription> findByStatusOrderByCreatedAtDesc(PrescriptionStatus status);

    List<Prescription> findByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, PrescriptionStatus status);

    List<Prescription> findByChronicSubscriptionTrueOrderByCreatedAtDesc();

    List<Prescription> findByStatusAndChronicSubscriptionFalseAndIsFileDeletedFalseAndVerifiedAtBefore(
            PrescriptionStatus status,
            LocalDateTime threshold
    );

    boolean existsByFileSha256(String hash);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Prescription p where p.id = :id")
    Optional<Prescription> findForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    Optional<Prescription> findByStoredFileName(String storedFileName);
}
