package com.mediorder.repository;

import com.mediorder.model.Prescription;
import com.mediorder.model.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    List<Prescription> findByStatusOrderByCreatedAtAsc(
            PrescriptionStatus status
    );

    List<Prescription> findByCustomerIdOrderByCreatedAtDesc(
            Long customerId
    );

    boolean existsByFileHash(String fileHash);

    Optional<Prescription> findByPrescriptionIdentifierAndVersion(
            String prescriptionIdentifier,
            Integer version
    );

    Optional<Prescription> findTopByPrescriptionIdentifierOrderByVersionDesc(
            String prescriptionIdentifier
    );
}