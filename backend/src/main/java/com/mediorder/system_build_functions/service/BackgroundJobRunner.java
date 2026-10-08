package com.mediorder.system_build_functions.service;

import com.mediorder.it25102867_batchandstock_management.model.BatchStatus;
import com.mediorder.it25102867_batchandstock_management.model.InventoryBatch;
import com.mediorder.it25102867_batchandstock_management.repository.InventoryBatchRepository;
import com.mediorder.it25103946_order_processing_and_workflow.model.ReservationStatus;
import com.mediorder.it25103946_order_processing_and_workflow.model.StockReservation;
import com.mediorder.it25103946_order_processing_and_workflow.repository.StockReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BackgroundJobRunner {

    private static final Logger log = LoggerFactory.getLogger(BackgroundJobRunner.class);

    private final StockReservationRepository stockReservationRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final AuditService auditService;

    public BackgroundJobRunner(
            StockReservationRepository stockReservationRepository,
            InventoryBatchRepository inventoryBatchRepository,
            AuditService auditService) {
        this.stockReservationRepository = stockReservationRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.auditService = auditService;
    }

    /**
     * Runs every 5 minutes to release expired reservations and return reserved stock
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void sweepExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<StockReservation> expiredList = stockReservationRepository.findExpiredReservations(now);

        if (!expiredList.isEmpty()) {
            log.info("Sweeping {} expired stock reservations", expiredList.size());
            for (StockReservation res : expiredList) {
                res.setStatus(ReservationStatus.EXPIRED);
                InventoryBatch batch = res.getBatch();
                if (batch != null) {
                    int reserved = batch.getQtyReserved() != null ? batch.getQtyReserved() : 0;
                    batch.setQtyReserved(Math.max(0, reserved - res.getQuantity()));
                    inventoryBatchRepository.save(batch);
                }
                stockReservationRepository.save(res);
                auditService.log(null, "system", "SYSTEM", "EXPIRE_RESERVATION", "StockReservation",
                        String.valueOf(res.getId()), "RESERVED", "EXPIRED", "127.0.0.1");
            }
        }
    }

    /**
     * Runs daily at midnight to quarantine/expire expired inventory batches
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void sweepExpiredBatches() {
        LocalDate today = LocalDate.now();
        List<InventoryBatch> expiringBatches = inventoryBatchRepository.findExpiringBatches(today);

        if (!expiringBatches.isEmpty()) {
            log.info("Sweeping {} expired inventory batches", expiringBatches.size());
            for (InventoryBatch batch : expiringBatches) {
                String before = batch.getStatus().name();
                batch.setStatus(BatchStatus.EXPIRED);
                inventoryBatchRepository.save(batch);
                auditService.log(null, "system", "SYSTEM", "AUTO_EXPIRE_BATCH", "InventoryBatch",
                        batch.getBatchNumber(), before, "EXPIRED", "127.0.0.1");
            }
        }
    }
}
