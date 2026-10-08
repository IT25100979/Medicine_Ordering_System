package com.mediorder.it25102867_batchandstock_management.service;

import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTagRepository;
import com.mediorder.it25102867_batchandstock_management.model.BatchStatus;
import com.mediorder.it25102867_batchandstock_management.model.InventoryBatch;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.InventoryBatchRepository;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.system_build_functions.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InventoryBatchServiceTest {

    @Mock
    private InventoryBatchRepository batchRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private ColdChainTagRepository coldChainTagRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private InventoryBatchService batchService;

    private Medicine med1;
    private Medicine med2;
    private InventoryBatch batch1;
    private InventoryBatch batch2;

    @BeforeEach
    void setUp() {
        med1 = Medicine.builder()
                .id(1L)
                .name("Paracetamol 500mg")
                .sku("SKU-MED-001")
                .stockQuantity(100)
                .isTemperatureSensitive(false)
                .requiresPrescription(false)
                .build();

        med2 = Medicine.builder()
                .id(2L)
                .name("Amoxicillin 250mg")
                .sku("SKU-MED-002")
                .stockQuantity(50)
                .isTemperatureSensitive(true)
                .requiresPrescription(true)
                .build();

        batch1 = InventoryBatch.builder()
                .id(10L)
                .batchNumber("Batch 1")
                .medicine(med1)
                .stockQuantity(50)
                .expiryDate(LocalDate.now().plusMonths(6))
                .status(BatchStatus.LIVE)
                .build();

        batch2 = InventoryBatch.builder()
                .id(11L)
                .batchNumber("Batch 1")
                .medicine(med2)
                .stockQuantity(30)
                .expiryDate(LocalDate.now().plusMonths(9))
                .status(BatchStatus.LIVE)
                .build();
    }

    @Test
    void testGetGroupedBatches_ReturnsGroupedStructure() {
        when(batchRepository.findAllByOrderByBatchNumberAscIdAsc()).thenReturn(List.of(batch1, batch2));

        List<Map<String, Object>> grouped = batchService.getGroupedBatches();

        assertEquals(1, grouped.size());
        assertEquals("Batch 1", grouped.get(0).get("batchNumber"));
        assertEquals(2, ((List<?>) grouped.get(0).get("medicines")).size());
        assertEquals(80, grouped.get(0).get("totalStock"));
    }

    @Test
    void testSendBatchGroupForTagging_UpdatesAllItemsInBatch() {
        when(batchRepository.findAllByBatchNumber("Batch 1")).thenReturn(List.of(batch1, batch2));
        when(batchRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        List<InventoryBatch> updated = batchService.sendBatchGroupByNumberForTagging("Batch 1", "ops@mediorder.com");

        assertEquals(2, updated.size());
        assertEquals(BatchStatus.COLD_CHAIN_REVIEW, batch1.getStatus());
        assertEquals(BatchStatus.COLD_CHAIN_REVIEW, batch2.getStatus());
        verify(auditService, times(1)).logAction(eq("UPDATE_BATCH_GROUP_STATUS"), eq("InventoryBatchGroup"), eq("Batch 1"), any(), any());
    }

    @Test
    void testApproveBatchLive_UpdatesStatusToLive() {
        batch1.setStatus(BatchStatus.COLD_CHAIN_REVIEW);
        when(batchRepository.findById(10L)).thenReturn(Optional.of(batch1));
        when(batchRepository.save(any(InventoryBatch.class))).thenAnswer(i -> i.getArgument(0));

        InventoryBatch result = batchService.approveBatchLive(10L, "chief@mediorder.com");

        assertEquals(BatchStatus.LIVE, result.getStatus());
        verify(auditService, times(1)).logAction(eq("APPROVE_BATCH_LIVE"), eq("InventoryBatch"), eq("10"), any(), any());
    }
}
