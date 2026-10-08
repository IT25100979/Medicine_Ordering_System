package com.mediorder.it25102867_batchandstock_management.service;

import com.mediorder.it25102867_batchandstock_management.model.BatchStatus;
import com.mediorder.it25102867_batchandstock_management.model.InventoryBatch;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.InventoryBatchRepository;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.it25103946_order_processing_and_workflow.model.ReservationStatus;
import com.mediorder.it25103946_order_processing_and_workflow.model.StockReservation;
import com.mediorder.it25103946_order_processing_and_workflow.repository.StockReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FefoAllocationServiceTest {

    @Mock
    private InventoryBatchRepository batchRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private StockReservationRepository reservationRepository;

    @InjectMocks
    private FefoAllocationService fefoService;

    private Medicine testMedicine;
    private InventoryBatch batchEarlyExpiry;
    private InventoryBatch batchLateExpiry;

    @BeforeEach
    void setUp() {
        testMedicine = Medicine.builder()
                .id(1L)
                .name("Paracetamol 500mg")
                .stockQuantity(100)
                .allocatedStock(0)
                .build();

        batchEarlyExpiry = InventoryBatch.builder()
                .id(101L)
                .medicine(testMedicine)
                .batchNumber("BATCH-EARLY")
                .stockQuantity(30)
                .qtyReserved(0)
                .expiryDate(LocalDate.now().plusMonths(2))
                .status(BatchStatus.LIVE)
                .build();

        batchLateExpiry = InventoryBatch.builder()
                .id(102L)
                .medicine(testMedicine)
                .batchNumber("BATCH-LATE")
                .stockQuantity(70)
                .qtyReserved(0)
                .expiryDate(LocalDate.now().plusMonths(12))
                .status(BatchStatus.LIVE)
                .build();
    }

    @Test
    void testReserveStockFEFO_AllocatesFromEarliestExpiringBatchFirst() {
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(testMedicine));
        when(batchRepository.findFefoCandidateBatches(eq(1L), any(LocalDate.class)))
                .thenReturn(Arrays.asList(batchEarlyExpiry, batchLateExpiry));
        when(reservationRepository.save(any(StockReservation.class))).thenAnswer(i -> i.getArgument(0));

        // Request 50 units (should take all 30 from batchEarlyExpiry and 20 from batchLateExpiry)
        List<StockReservation> reservations = fefoService.reserveStockFEFO(5001L, 1L, 50);

        assertEquals(2, reservations.size());
        assertEquals(30, reservations.get(0).getQuantity());
        assertEquals("BATCH-EARLY", reservations.get(0).getBatch().getBatchNumber());

        assertEquals(20, reservations.get(1).getQuantity());
        assertEquals("BATCH-LATE", reservations.get(1).getBatch().getBatchNumber());

        assertEquals(50, testMedicine.getAllocatedStock());
        verify(medicineRepository, times(1)).save(testMedicine);
    }

    @Test
    void testReserveStockFEFO_ThrowsConflictWhenInsufficientStock() {
        testMedicine.setStockQuantity(20);
        testMedicine.setAllocatedStock(10);
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(testMedicine));

        // Request 15 when only 10 unreserved available
        assertThrows(ResponseStatusException.class, () -> {
            fefoService.reserveStockFEFO(5002L, 1L, 15);
        });
    }

    @Test
    void testConfirmOrderStock_DeductsBatchAndMedicineStock() {
        StockReservation res1 = StockReservation.builder()
                .id(1L)
                .orderId(5001L)
                .batch(batchEarlyExpiry)
                .quantity(30)
                .status(ReservationStatus.RESERVED)
                .build();

        when(reservationRepository.findByOrderIdAndStatus(5001L, ReservationStatus.RESERVED))
                .thenReturn(List.of(res1));

        fefoService.confirmOrderStock(5001L);

        assertEquals(0, batchEarlyExpiry.getStockQuantity());
        assertEquals(BatchStatus.DEPLETED, batchEarlyExpiry.getStatus());
        assertEquals(ReservationStatus.CONFIRMED, res1.getStatus());
    }

    @Test
    void testReleaseOrderStock_ReleasesReservedCounts() {
        batchEarlyExpiry.setQtyReserved(30);
        testMedicine.setAllocatedStock(30);

        StockReservation res1 = StockReservation.builder()
                .id(1L)
                .orderId(5001L)
                .batch(batchEarlyExpiry)
                .quantity(30)
                .status(ReservationStatus.RESERVED)
                .build();

        when(reservationRepository.findByOrderIdAndStatus(5001L, ReservationStatus.RESERVED))
                .thenReturn(List.of(res1));

        fefoService.releaseOrderStock(5001L);

        assertEquals(0, batchEarlyExpiry.getQtyReserved());
        assertEquals(0, testMedicine.getAllocatedStock());
        assertEquals(ReservationStatus.RELEASED, res1.getStatus());
    }
}
