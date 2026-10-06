package com.mediorder.repository;

import com.mediorder.model.BatchStatus;
import com.mediorder.model.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {

    List<InventoryBatch> findAllByOrderByExpiryDateAsc();

    List<InventoryBatch> findByMedicineIdOrderByExpiryDateAsc(Long medicineId);

    List<InventoryBatch> findByStatusOrderByExpiryDateAsc(BatchStatus status);

    List<InventoryBatch> findByStatusInOrderByExpiryDateAsc(Collection<BatchStatus> statuses);

    List<InventoryBatch> findByMedicineIdAndStatusInOrderByExpiryDateAsc(Long medicineId, Collection<BatchStatus> statuses);

    List<InventoryBatch> findByExpiryDateBefore(LocalDate date);

    List<InventoryBatch> findByExpiryDateBetweenOrderByExpiryDateAsc(LocalDate startDate, LocalDate endDate);

    boolean existsByBatchNumber(String batchNumber);

    Optional<InventoryBatch> findByBatchNumber(String batchNumber);

    @Query("SELECT b FROM InventoryBatch b WHERE " +
           "LOWER(b.batchNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.medicine.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.medicine.genericName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.shelfLocation) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY b.expiryDate ASC")
    List<InventoryBatch> searchBatchesOrderByFefo(@Param("query") String query);

    @Query("SELECT COALESCE(SUM(b.quantityAvailable), 0) FROM InventoryBatch b WHERE b.medicine.id = :medicineId AND b.status IN :statuses")
    Integer sumAvailableQuantityByMedicineAndStatuses(@Param("medicineId") Long medicineId, @Param("statuses") Collection<BatchStatus> statuses);

    @Query("SELECT COUNT(b) FROM InventoryBatch b WHERE b.expiryDate <= :thresholdDate AND b.status NOT IN ('EXPIRED', 'QUARANTINED')")
    long countExpiringSoon(@Param("thresholdDate") LocalDate thresholdDate);
}
