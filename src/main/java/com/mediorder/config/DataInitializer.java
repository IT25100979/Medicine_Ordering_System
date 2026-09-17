package com.mediorder.config;

import com.mediorder.model.BatchStatus;
import com.mediorder.model.InventoryBatch;
import com.mediorder.model.Medicine;
import com.mediorder.repository.InventoryBatchRepository;
import com.mediorder.repository.MedicineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository batchRepository;

    public DataInitializer(MedicineRepository medicineRepository, InventoryBatchRepository batchRepository) {
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
    }

    @Override
    public void run(String... args) {
        if (medicineRepository.count() > 0) {
            log.info("Database already seeded with medicines and batches. Skipping initialization.");
            return;
        }

        log.info("Seeding initial pharmaceutical catalog and inventory batches with FEFO test scenarios...");

        // 1. Paracetamol 500mg
        Medicine para = new Medicine(
                "Paracetamol 500mg",
                "Acetaminophen",
                "Analgesics & Antipyretics",
                "500mg Oral Tablet",
                new BigDecimal("4.50"),
                false,
                50
        );
        para.setDescription("First-line antipyretic and analgesic medication for mild to moderate pain and fever relief.");
        medicineRepository.save(para);

        // Paracetamol Batches demonstrating FEFO, Near-Expiry, Quarantine, and Expired rules:
        InventoryBatch paraBatchNearExpiry = new InventoryBatch(
                para, "BATCH-2026-PARA-01", LocalDate.now().minusMonths(5), LocalDate.now().plusDays(20), 40, "Aisle 1 - Shelf A1"
        );
        paraBatchNearExpiry.setStatus(BatchStatus.NEAR_EXPIRY);
        batchRepository.save(paraBatchNearExpiry);

        InventoryBatch paraBatchFresh = new InventoryBatch(
                para, "BATCH-2026-PARA-02", LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(8), 100, "Aisle 1 - Shelf A2"
        );
        paraBatchFresh.setStatus(BatchStatus.ACTIVE);
        batchRepository.save(paraBatchFresh);

        InventoryBatch paraBatchQuarantined = new InventoryBatch(
                para, "BATCH-2026-PARA-03", LocalDate.now().minusMonths(3), LocalDate.now().plusMonths(6), 30, "Quarantine Bay Q1"
        );
        paraBatchQuarantined.setStatus(BatchStatus.QUARANTINED);
        paraBatchQuarantined.setQuarantineReason("Packaging seal integrity check failed upon supplier receipt");
        batchRepository.save(paraBatchQuarantined);

        InventoryBatch paraBatchExpired = new InventoryBatch(
                para, "BATCH-2026-PARA-04", LocalDate.now().minusYears(1), LocalDate.now().minusDays(15), 15, "Disposal Storage D1"
        );
        paraBatchExpired.setStatus(BatchStatus.EXPIRED);
        paraBatchExpired.setQuarantineReason("Expired past shelf stability threshold");
        batchRepository.save(paraBatchExpired);

        // 2. Amoxicillin 250mg
        Medicine amox = new Medicine(
                "Amoxicillin 250mg",
                "Amoxicillin Trihydrate",
                "Antibiotics",
                "250mg Capsule",
                new BigDecimal("12.00"),
                true,
                40
        );
        amox.setDescription("Broad-spectrum beta-lactam antibiotic used to treat bacterial infections.");
        medicineRepository.save(amox);

        InventoryBatch amoxBatch1 = new InventoryBatch(
                amox, "BATCH-2026-AMOX-01", LocalDate.now().minusMonths(4), LocalDate.now().plusDays(45), 60, "Aisle 2 - Shelf B1"
        );
        batchRepository.save(amoxBatch1);

        InventoryBatch amoxBatch2 = new InventoryBatch(
                amox, "BATCH-2026-AMOX-02", LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(12), 150, "Aisle 2 - Shelf B2"
        );
        batchRepository.save(amoxBatch2);

        // 3. Metformin 500mg
        Medicine met = new Medicine(
                "Metformin 500mg",
                "Metformin Hydrochloride",
                "Antidiabetic",
                "500mg Extended Release Tablet",
                new BigDecimal("8.75"),
                true,
                30
        );
        met.setDescription("Oral biguanide anti-hyperglycemic agent for managing type 2 diabetes mellitus.");
        medicineRepository.save(met);

        InventoryBatch metBatch1 = new InventoryBatch(
                met, "BATCH-2026-MET-01", LocalDate.now().minusMonths(2), LocalDate.now().plusDays(90), 80, "Aisle 3 - Shelf C1"
        );
        batchRepository.save(metBatch1);

        // 4. Atorvastatin 20mg
        Medicine ator = new Medicine(
                "Atorvastatin 20mg",
                "Atorvastatin Calcium",
                "Cardiovascular",
                "20mg Film-coated Tablet",
                new BigDecimal("15.50"),
                true,
                25
        );
        ator.setDescription("HMG-CoA reductase inhibitor (statin) for hypercholesterolemia and cardiovascular risk reduction.");
        medicineRepository.save(ator);

        InventoryBatch atorBatchNear = new InventoryBatch(
                ator, "BATCH-2026-ATOR-01", LocalDate.now().minusMonths(6), LocalDate.now().plusDays(15), 25, "Aisle 4 - Shelf D1"
        );
        atorBatchNear.setStatus(BatchStatus.NEAR_EXPIRY);
        batchRepository.save(atorBatchNear);

        InventoryBatch atorBatchFresh = new InventoryBatch(
                ator, "BATCH-2026-ATOR-02", LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(10), 90, "Aisle 4 - Shelf D2"
        );
        batchRepository.save(atorBatchFresh);

        log.info("Catalog & Batch initial seeding complete. Ready for FEFO order transactions!");
    }
}
