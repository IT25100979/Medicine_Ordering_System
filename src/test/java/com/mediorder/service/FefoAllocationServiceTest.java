package com.mediorder.service;

import com.mediorder.exception.InsufficientStockException;
import com.mediorder.model.BatchStatus;
import com.mediorder.model.InventoryBatch;
import com.mediorder.model.Medicine;
import com.mediorder.repository.InventoryBatchRepository;
import com.mediorder.repository.MedicineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FefoAllocationServiceTest {

    @Mock
    private InventoryBatchRepository batchRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @InjectMocks
    private FefoAllocationService fefoAllocationService;

    private Medicine paracetamol;
    private InventoryBatch batchEarliest;
    private InventoryBatch batchLater;

    @BeforeEach
    void setUp() {
        paracetamol = new Medicine("Paracetamol 500mg", "Acetaminophen", "Analgesic", "500mg", new BigDecimal("5.00"), false, 20);
        paracetamol.setId(1L);

        // Batch 1 expires in 15 days, 30 units available
        batchEarliest = new InventoryBatch(paracetamol, "BATCH-001", LocalDate.now().minusMonths(3), LocalDate.now().plusDays(15), 30, "Shelf A1");
        batchEarliest.setId(101L);

        // Batch 2 expires in 90 days, 50 units available
        batchLater = new InventoryBatch(paracetamol, "BATCH-002", LocalDate.now().minusMonths(1), LocalDate.now().plusDays(90), 50, "Shelf A2");
        batchLater.setId(102L);
    }

    @Test
    @DisplayName("FEFO: Should strictly allocate from earliest expiring batch first")
    void testAllocateStockFromEarliestBatchFirst() {
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(paracetamol));
        when(batchRepository.findActiveBatchesForFefoWithLock(eq(1L), anyCollection(), any(LocalDate.class)))
                .thenReturn(new ArrayList<>(Arrays.asList(batchEarliest, batchLater)));

        // Request 20 units (fits entirely within batchEarliest which has 30)
        List<FefoAllocationService.AllocationResult> results = fefoAllocationService.allocateStockFefo(1L, 20);

        assertEquals(1, results.size(), "Should allocate from single earliest batch");
        assertEquals(101L, results.get(0).getBatch().getId());
        assertEquals(20, results.get(0).getAllocatedQuantity());
        assertEquals(10, batchEarliest.getQuantityAvailable(), "Remaining stock in batchEarliest should be 10");
        assertEquals(50, batchLater.getQuantityAvailable(), "Later batch should not be touched");

        verify(batchRepository, times(1)).save(batchEarliest);
        verify(batchRepository, never()).save(batchLater);
    }

    @Test
    @DisplayName("FEFO: Should split allocation across multiple batches when first batch is exhausted")
    void testAllocateStockSplitAcrossBatches() {
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(paracetamol));
        when(batchRepository.findActiveBatchesForFefoWithLock(eq(1L), anyCollection(), any(LocalDate.class)))
                .thenReturn(new ArrayList<>(Arrays.asList(batchEarliest, batchLater)));

        // Request 45 units (exhausts batchEarliest [30] and takes 15 from batchLater [50])
        List<FefoAllocationService.AllocationResult> results = fefoAllocationService.allocateStockFefo(1L, 45);

        assertEquals(2, results.size(), "Should split allocation across both batches");

        assertEquals(101L, results.get(0).getBatch().getId());
        assertEquals(30, results.get(0).getAllocatedQuantity());
        assertEquals(0, batchEarliest.getQuantityAvailable());

        assertEquals(102L, results.get(1).getBatch().getId());
        assertEquals(15, results.get(1).getAllocatedQuantity());
        assertEquals(35, batchLater.getQuantityAvailable());

        verify(batchRepository).save(batchEarliest);
        verify(batchRepository).save(batchLater);
    }

    @Test
    @DisplayName("FEFO: Should reject order when total eligible non-expired stock is insufficient")
    void testInsufficientStockThrowsException() {
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(paracetamol));
        when(batchRepository.findActiveBatchesForFefoWithLock(eq(1L), anyCollection(), any(LocalDate.class)))
                .thenReturn(new ArrayList<>(Arrays.asList(batchEarliest, batchLater)));

        // Request 100 units when total available is 30 + 50 = 80
        assertThrows(InsufficientStockException.class, () -> {
            fefoAllocationService.allocateStockFefo(1L, 100);
        });

        verify(batchRepository, never()).save(any(InventoryBatch.class));
    }
}
