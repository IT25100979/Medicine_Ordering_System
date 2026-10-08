package com.mediorder.it25102867_batchandstock_management.repository;

import com.mediorder.it25102867_batchandstock_management.model.BatchStatus;
import com.mediorder.it25102867_batchandstock_management.model.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
    Optional<InventoryBatch> findByBatchNumber(String batchNumber);
    List<InventoryBatch> findAllByBatchNumber(String batchNumber);
    List<InventoryBatch> findAllByOrderByBatchNumberAscIdAsc();
    List<InventoryBatch> findByMedicineId(Long medicineId);
    List<InventoryBatch> findByMedicineIdOrderByExpiryDateAsc(Long medicineId);
    List<InventoryBatch> findByMedicineIdAndStatusOrderByExpiryDateAsc(Long medicineId, BatchStatus status);
    List<InventoryBatch> findByStatusOrderByExpiryDateAsc(BatchStatus status);

    @Query("SELECT b FROM InventoryBatch b WHERE b.medicine.id = :medicineId AND (b.status = 'LIVE' OR b.status = 'ACTIVE') AND b.expiryDate > :today AND b.stockQuantity > b.qtyReserved ORDER BY b.expiryDate ASC")
    List<InventoryBatch> findFefoCandidateBatches(@Param("medicineId") Long medicineId, @Param("today") LocalDate today);

    @Query("SELECT b FROM InventoryBatch b WHERE b.expiryDate <= :targetDate AND (b.status = 'LIVE' OR b.status = 'ACTIVE')")
    List<InventoryBatch> findExpiringBatches(@Param("targetDate") LocalDate targetDate);
}
