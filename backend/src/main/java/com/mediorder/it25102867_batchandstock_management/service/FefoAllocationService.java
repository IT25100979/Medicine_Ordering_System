package com.mediorder.it25102867_batchandstock_management.service;

import com.mediorder.it25102867_batchandstock_management.model.BatchStatus;
import com.mediorder.it25102867_batchandstock_management.model.InventoryBatch;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.InventoryBatchRepository;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.it25103946_order_processing_and_workflow.model.ReservationStatus;
import com.mediorder.it25103946_order_processing_and_workflow.model.StockReservation;
import com.mediorder.it25103946_order_processing_and_workflow.repository.StockReservationRepository;
import com.mediorder.system_build_functions.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class FefoAllocationService {

    @Autowired
    private InventoryBatchRepository batchRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private StockReservationRepository reservationRepository;

    @Autowired(required = false)
    private AuditService auditService;

    /**
     * Reserve stock for an order using strict First-Expired, First-Out (FEFO) strategy.
     */
    public List<StockReservation> reserveStockFEFO(Long orderId, Long medicineId, int requestedQty) {
        return reserveStockFEFO(orderId, medicineId, requestedQty, java.time.Duration.ofMinutes(15));
    }

    /**
     * Same as above with a custom hold time. {@code hold == null} keeps the reservation until the order
     * is explicitly confirmed (delivered) or released (cancelled) - used for placed orders.
     */
    public List<StockReservation> reserveStockFEFO(Long orderId, Long medicineId, int requestedQty, java.time.Duration hold) {
        if (requestedQty <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requested quantity must be greater than zero");
        }

        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found with id: " + medicineId));

        // Check if medicine has enough overall available stock
        int currentStock = medicine.getStockQuantity() != null ? medicine.getStockQuantity() : 0;
        int currentAlloc = medicine.getAllocatedStock() != null ? medicine.getAllocatedStock() : 0;
        int availableUnreserved = currentStock - currentAlloc;

        if (availableUnreserved < requestedQty) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("Insufficient stock for %s. Available: %d, Requested: %d", medicine.getName(), Math.max(0, availableUnreserved), requestedQty));
        }

        // Fetch candidate batches sorted by FEFO (expiryDate ASC)
        List<InventoryBatch> candidateBatches = batchRepository.findFefoCandidateBatches(medicineId, LocalDate.now());
        List<StockReservation> createdReservations = new ArrayList<>();
        int remainingToAllocate = requestedQty;
        LocalDateTime expiresAt = hold != null ? LocalDateTime.now().plus(hold) : null;

        for (InventoryBatch batch : candidateBatches) {
            if (remainingToAllocate <= 0) break;

            int batchAvailable = batch.getStockQuantity() - (batch.getQtyReserved() != null ? batch.getQtyReserved() : 0);
            if (batchAvailable <= 0) continue;

            int allocateFromThisBatch = Math.min(batchAvailable, remainingToAllocate);

            // Update batch reserved counter
            batch.setQtyReserved((batch.getQtyReserved() != null ? batch.getQtyReserved() : 0) + allocateFromThisBatch);
            batchRepository.save(batch);

            // Create reservation record
            StockReservation reservation = StockReservation.builder()
                    .orderId(orderId)
                    .batch(batch)
                    .quantity(allocateFromThisBatch)
                    .status(ReservationStatus.RESERVED)
                    .createdAt(LocalDateTime.now())
                    .expiresAt(expiresAt)
                    .build();

            createdReservations.add(reservationRepository.save(reservation));
            remainingToAllocate -= allocateFromThisBatch;
        }

        // Never hand out a partial allocation: sellable (LIVE, unexpired) batches must cover the whole quantity.
        if (remainingToAllocate > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, String.format(
                    "Insufficient sellable stock for %s. Available in live batches: %d, Requested: %d",
                    medicine.getName(), requestedQty - remainingToAllocate, requestedQty));
        }

        // Update medicine allocated counter
        medicine.setAllocatedStock(currentAlloc + requestedQty);
        medicineRepository.save(medicine);

        if (auditService != null) {
            auditService.logAction("FEFO_STOCK_RESERVED", "Order", String.valueOf(orderId),
                    "Requested: " + requestedQty, "Allocated across " + createdReservations.size() + " batch(es)");
        }

        return createdReservations;
    }

    /**
     * Confirm reservations when order is paid / finalized.
     */
    public void confirmOrderStock(Long orderId) {
        List<StockReservation> reservations = reservationRepository.findByOrderIdAndStatus(orderId, ReservationStatus.RESERVED);

        for (StockReservation res : reservations) {
            res.setStatus(ReservationStatus.CONFIRMED);
            reservationRepository.save(res);

            InventoryBatch batch = res.getBatch();
            if (batch != null) {
                int newStock = Math.max(0, batch.getStockQuantity() - res.getQuantity());
                int newReserved = Math.max(0, (batch.getQtyReserved() != null ? batch.getQtyReserved() : 0) - res.getQuantity());
                batch.setStockQuantity(newStock);
                batch.setQtyReserved(newReserved);
                if (newStock == 0) {
                    batch.setStatus(BatchStatus.DEPLETED);
                }
                batchRepository.save(batch);

                // Update parent medicine stock
                Medicine medicine = batch.getMedicine();
                if (medicine != null) {
                    medicine.setStockQuantity(Math.max(0, (medicine.getStockQuantity() != null ? medicine.getStockQuantity() : 0) - res.getQuantity()));
                    medicine.setAllocatedStock(Math.max(0, (medicine.getAllocatedStock() != null ? medicine.getAllocatedStock() : 0) - res.getQuantity()));
                    medicineRepository.save(medicine);
                }
            }
        }

        if (auditService != null) {
            auditService.logAction("FEFO_STOCK_CONFIRMED", "Order", String.valueOf(orderId),
                    "RESERVED", "CONFIRMED (" + reservations.size() + " allocations)");
        }
    }

    /**
     * Puts stock that was already deducted for an order back on the shelf (same batches),
     * e.g. a pharmacist-dispensed order whose delivery was later rejected or terminated.
     */
    public void returnConfirmedStock(Long orderId) {
        List<StockReservation> confirmed = reservationRepository.findByOrderIdAndStatus(orderId, ReservationStatus.CONFIRMED);
        for (StockReservation res : confirmed) {
            res.setStatus(ReservationStatus.RELEASED);
            reservationRepository.save(res);
            InventoryBatch batch = res.getBatch();
            if (batch != null) {
                batch.setStockQuantity(batch.getStockQuantity() + res.getQuantity());
                if (batch.getStatus() == BatchStatus.DEPLETED) {
                    batch.setStatus(BatchStatus.LIVE);
                }
                batchRepository.save(batch);
                Medicine medicine = batch.getMedicine();
                if (medicine != null) {
                    medicine.setStockQuantity((medicine.getStockQuantity() != null ? medicine.getStockQuantity() : 0) + res.getQuantity());
                    medicineRepository.save(medicine);
                }
            }
        }
        if (auditService != null && !confirmed.isEmpty()) {
            auditService.logAction("FEFO_STOCK_RETURNED", "Order", String.valueOf(orderId),
                    "CONFIRMED", "RETURNED (" + confirmed.size() + " allocations)");
        }
    }

    /**
     * Release reservations if order fails, is cancelled, or expires.
     */
    public void releaseOrderStock(Long orderId) {
        List<StockReservation> reservations = reservationRepository.findByOrderIdAndStatus(orderId, ReservationStatus.RESERVED);

        for (StockReservation res : reservations) {
            res.setStatus(ReservationStatus.RELEASED);
            reservationRepository.save(res);

            InventoryBatch batch = res.getBatch();
            if (batch != null) {
                int newReserved = Math.max(0, (batch.getQtyReserved() != null ? batch.getQtyReserved() : 0) - res.getQuantity());
                batch.setQtyReserved(newReserved);
                batchRepository.save(batch);

                Medicine medicine = batch.getMedicine();
                if (medicine != null) {
                    medicine.setAllocatedStock(Math.max(0, (medicine.getAllocatedStock() != null ? medicine.getAllocatedStock() : 0) - res.getQuantity()));
                    medicineRepository.save(medicine);
                }
            }
        }

        if (auditService != null) {
            auditService.logAction("FEFO_STOCK_RELEASED", "Order", String.valueOf(orderId),
                    "RESERVED", "RELEASED (" + reservations.size() + " allocations)");
        }
    }
}
