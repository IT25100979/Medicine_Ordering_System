package com.mediorder.repository;

import com.mediorder.model.BatchStatus;
import com.mediorder.model.InventoryBatch;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {

    Optional<InventoryBatch> findByBatchNumber(String batchNumber);

    List<InventoryBatch> findByMedicineIdOrderByExpiryDateAsc(Long medicineId);

    List<InventoryBatch> findByStatus(BatchStatus status);

    @Query("SELECT b FROM InventoryBatch b WHERE b.medicine.id = :medicineId AND b.status IN :statuses AND b.expiryDate > :currentDate AND b.quantityAvailable > 0 ORDER BY b.expiryDate ASC")
    List<InventoryBatch> findActiveBatchesForFefo(
            @Param("medicineId") Long medicineId,
            @Param("statuses") Collection<BatchStatus> statuses,
            @Param("currentDate") LocalDate currentDate
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM InventoryBatch b WHERE b.medicine.id = :medicineId AND b.status IN :statuses AND b.expiryDate > :currentDate AND b.quantityAvailable > 0 ORDER BY b.expiryDate ASC")
    List<InventoryBatch> findActiveBatchesForFefoWithLock(
            @Param("medicineId") Long medicineId,
            @Param("statuses") Collection<BatchStatus> statuses,
            @Param("currentDate") LocalDate currentDate
    );

    List<InventoryBatch> findByExpiryDateLessThanEqualAndStatusNot(LocalDate date, BatchStatus status);

    @Query("SELECT COALESCE(SUM(b.quantityAvailable), 0) FROM InventoryBatch b WHERE b.medicine.id = :medicineId AND b.status IN :statuses AND b.expiryDate > :currentDate")
    int sumAvailableStock(
            @Param("medicineId") Long medicineId,
            @Param("statuses") Collection<BatchStatus> statuses,
            @Param("currentDate") LocalDate currentDate
    );
}
