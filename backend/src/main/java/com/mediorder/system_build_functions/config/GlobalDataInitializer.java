package com.mediorder.system_build_functions.config;

import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainSection;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainTag;
import com.mediorder.it25101882_cold_chain_tagging.model.MedicineIntensity;
import com.mediorder.it25101882_cold_chain_tagging.model.SecurityLevel;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainTagRepository;
import com.mediorder.it25102867_batchandstock_management.model.*;
import com.mediorder.it25102867_batchandstock_management.repository.InventoryBatchRepository;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.it25102867_batchandstock_management.repository.SupplierRepository;
import com.mediorder.it25102867_batchandstock_management.repository.SupplierShipmentRepository;
import com.mediorder.system_build_functions.model.*;
import com.mediorder.system_build_functions.repository.FeatureFlagRepository;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@Order(1)
public class GlobalDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(GlobalDataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FeatureFlagRepository featureFlagRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierShipmentRepository supplierShipmentRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final ColdChainTagRepository coldChainTagRepository;
    private final JdbcTemplate jdbcTemplate;

    public GlobalDataInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            FeatureFlagRepository featureFlagRepository,
            SupplierRepository supplierRepository,
            SupplierShipmentRepository supplierShipmentRepository,
            MedicineRepository medicineRepository,
            InventoryBatchRepository inventoryBatchRepository,
            ColdChainTagRepository coldChainTagRepository,
            JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.featureFlagRepository = featureFlagRepository;
        this.supplierRepository = supplierRepository;
        this.supplierShipmentRepository = supplierShipmentRepository;
        this.medicineRepository = medicineRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.coldChainTagRepository = coldChainTagRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        log.info("Starting GlobalDataInitializer: flushing and seeding strictly from manualCodeEdits.md...");
        autoMigrateSchema();
        flushCatalogAndStockTables();
        seedDemoUsers();
        seedFeatureFlags();
        seedSuppliers();
        seedOfficialCatalogAndBatches();
    }

    private void autoMigrateSchema() {
        if (jdbcTemplate != null) {
            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL");
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN status VARCHAR(50) NOT NULL");
                log.info("Successfully ensured users table schema has VARCHAR(50) role and status columns.");
            } catch (Exception ex) {
                log.info("User schema auto-migration check completed: {}", ex.getMessage());
            }

            try {
                List<String> uniqueIndexes = jdbcTemplate.query(
                        "SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS " +
                        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_batches' " +
                        "AND COLUMN_NAME = 'batch_number' AND NON_UNIQUE = 0",
                        (rs, rowNum) -> rs.getString("INDEX_NAME")
                );
                for (String idx : uniqueIndexes) {
                    if (!"PRIMARY".equalsIgnoreCase(idx)) {
                        jdbcTemplate.execute("ALTER TABLE inventory_batches DROP INDEX `" + idx + "`");
                        log.info("Dropped legacy unique constraint {} from inventory_batches", idx);
                    }
                }
            } catch (Exception ex) {
                log.info("Index check on inventory_batches: {}", ex.getMessage());
            }
        }
    }

    private void flushCatalogAndStockTables() {
        log.info("Flushing all stock, batch, cold chain tag, and medicine catalog tables...");
        try {
            if (jdbcTemplate != null) {
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
                try { jdbcTemplate.execute("TRUNCATE TABLE cart_items"); } catch (Exception ignored) {}
                try { jdbcTemplate.execute("TRUNCATE TABLE order_items"); } catch (Exception ignored) {}
                try { jdbcTemplate.execute("TRUNCATE TABLE cold_chain_telemetry"); } catch (Exception ignored) {}
                try { jdbcTemplate.execute("TRUNCATE TABLE cold_chain_tags"); } catch (Exception ignored) {}
                try { jdbcTemplate.execute("TRUNCATE TABLE inventory_batches"); } catch (Exception ignored) {}
                try { jdbcTemplate.execute("TRUNCATE TABLE stock_reservations"); } catch (Exception ignored) {}
                try { jdbcTemplate.execute("TRUNCATE TABLE medicines"); } catch (Exception ignored) {}
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
                log.info("Successfully truncated all stock and catalog database tables.");
            } else {
                coldChainTagRepository.deleteAll();
                inventoryBatchRepository.deleteAll();
                medicineRepository.deleteAll();
            }
        } catch (Exception ex) {
            log.warn("Truncate failed, executing repository deleteAll: {}", ex.getMessage());
            try { coldChainTagRepository.deleteAll(); } catch (Exception ignored) {}
            try { inventoryBatchRepository.deleteAll(); } catch (Exception ignored) {}
            try { medicineRepository.deleteAll(); } catch (Exception ignored) {}
        }
    }

    private void seedDemoUsers() {
        log.info("Flushing users table and creating new users strictly from manualCodeEdits.md...");
        try {
            if (jdbcTemplate != null) {
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
                jdbcTemplate.execute("TRUNCATE TABLE users");
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
                log.info("Successfully flushed users table via TRUNCATE.");
            } else {
                userRepository.deleteAll();
            }
        } catch (Exception ex) {
            log.warn("Truncate failed, falling back to userRepository.deleteAll(): {}", ex.getMessage());
            userRepository.deleteAll();
        }

        // Strictly seed only users from manualCodeEdits.md
        seedUser("customer1@gmail.com", "customer1", Role.CUSTOMER, "555-010-0001", "admin123");
        seedUser("systemadmin1@gmail.com", "systemadmin1", Role.SYSTEM_ADMIN, "555-010-0002", "admin123");
        seedUser("operationsmanager1@gmail.com", "operationsmanager1", Role.OPERATIONS_MANAGER, "555-010-0003", "admin123");
        seedUser("pharmacist1@gmail.com", "pharmacist1", Role.CHIEF_PHARMACIST, "555-010-0004", "admin123");
        seedUser("deliverycoordinator1@gmail.com", "deliverycoordinator1", Role.DELIVERY_COORDINATOR, "555-010-0005", "admin123");
        seedUser("courier1@gmail.com", "courier1", Role.DELIVERY_RIDER, "555-010-0006", "admin123");
    }

    private void seedUser(String email, String fullName, Role role, String phone, String rawPassword) {
        User user = User.builder()
                .email(email)
                .fullName(fullName)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .phoneNumber(phone)
                .role(role)
                .status(UserStatus.ACTIVE)
                .isDemo(false)
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(user);
        log.info("Seeded user from manualCodeEdits: {} ({}) with initial credentials.", email, role);
    }

    private void seedFeatureFlags() {
        seedFlag("ORDERING", "Storefront ordering and checkout engine");
        seedFlag("STOCK_INTAKE", "Warehouse shipment intake and batching");
        seedFlag("DELIVERY", "Courier dispatching and fleet routing");
        seedFlag("PRESCRIPTIONS", "Prescription verification and intake");
        seedFlag("REFILLS", "Subscription and auto-refill engine");
    }

    private void seedFlag(String key, String reason) {
        if (featureFlagRepository.findByFlagKey(key).isEmpty()) {
            FeatureFlag flag = FeatureFlag.builder()
                    .flagKey(key)
                    .enabled(true)
                    .scope("GLOBAL")
                    .reason(reason)
                    .setBy("SYSTEM")
                    .setAt(LocalDateTime.now())
                    .build();
            featureFlagRepository.save(flag);
        }
    }

    private void seedSuppliers() {
        if (supplierRepository.count() == 0) {
            Supplier s1 = supplierRepository.save(Supplier.builder()
                    .name("PharmaCorp International")
                    .contactPerson("Dr. Robert Sterling")
                    .email("supplies@pharmacorp.com")
                    .phone("+1 800 555 0199")
                    .address("100 Innovation Way, Boston, MA")
                    .licenseNumber("FDA-SUP-98234")
                    .isActive(true)
                    .build());

            Supplier s2 = supplierRepository.save(Supplier.builder()
                    .name("BioHealth Logistics & Vaccines")
                    .contactPerson("Elena Rostova")
                    .email("orders@biohealth.org")
                    .phone("+44 20 7946 0912")
                    .address("45 Thames Wharf, London, UK")
                    .licenseNumber("EMA-COLD-41092")
                    .isActive(true)
                    .build());

            log.info("Seeded 2 pharmaceutical suppliers: {}, {}", s1.getName(), s2.getName());
        }
    }

    private void seedOfficialCatalogAndBatches() {
        log.info("Seeding the 8 official catalog products, 2 batches, and cold-chain tags from manualCodeEdits.md...");

        List<Medicine> meds = new ArrayList<>();

        // 1. Amoxil 500mg
        meds.add(Medicine.builder()
                .name("Amoxil 500mg")
                .genericName("Amoxicillin")
                .sku("RX-AMX-500")
                .category("Prescription Medicines")
                .unitPrice(new BigDecimal("850.00"))
                .msrp(new BigDecimal("950.00"))
                .cogs(new BigDecimal("420.00"))
                .stockQuantity(150)
                .allocatedStock(12)
                .reorderLevel(30)
                .requiresPrescription(true)
                .isTemperatureSensitive(false)
                .minTemp(new BigDecimal("15.00"))
                .maxTemp(new BigDecimal("25.00"))
                .storageRequirement("Ambient Storage (15°C - 25°C)")
                .shelfLocation("Ambient Storage / Bay A-01")
                .batchNumber("BAT-2026-001")
                .barcode("BC-RX-AMX-500")
                .imageUrl("https://images.unsplash.com/photo-1584308666744-24d5e4708709?auto=format&fit=crop&q=80&w=400")
                .description("Broad-spectrum antibiotic used to treat various bacterial infections.")
                .rating(new BigDecimal("4.9"))
                .reviewsCount(142)
                .tags("Rx, Antibiotic, Oral")
                .createdAt(LocalDateTime.now())
                .build());

        // 2. Panadol Extra
        meds.add(Medicine.builder()
                .name("Panadol Extra")
                .genericName("Paracetamol & Caffeine")
                .sku("HW-PND-EXT")
                .category("Daily Health & Wellness")
                .unitPrice(new BigDecimal("120.00"))
                .msrp(new BigDecimal("150.00"))
                .cogs(new BigDecimal("60.00"))
                .stockQuantity(240)
                .allocatedStock(20)
                .reorderLevel(40)
                .requiresPrescription(false)
                .isTemperatureSensitive(false)
                .minTemp(new BigDecimal("15.00"))
                .maxTemp(new BigDecimal("25.00"))
                .storageRequirement("Ambient Storage (15°C - 25°C)")
                .shelfLocation("Ambient Storage / Bay A-02")
                .batchNumber("BAT-2026-001")
                .barcode("BC-HW-PND-EXT")
                .imageUrl("https://images.unsplash.com/photo-1550572017-edb799988b48?auto=format&fit=crop&q=80&w=400")
                .description("Fast, effective temporary relief of pain, headaches, and discomfort.")
                .rating(new BigDecimal("4.8"))
                .reviewsCount(210)
                .tags("OTC, Pain Relief, Daily Wellness")
                .createdAt(LocalDateTime.now())
                .build());

        // 3. Dettol Antiseptic Liquid 250ml
        meds.add(Medicine.builder()
                .name("Dettol Antiseptic Liquid 250ml")
                .genericName("Chloroxylenol")
                .sku("FA-DTL-250")
                .category("First Aid & Health Care")
                .unitPrice(new BigDecimal("450.00"))
                .msrp(new BigDecimal("520.00"))
                .cogs(new BigDecimal("220.00"))
                .stockQuantity(180)
                .allocatedStock(15)
                .reorderLevel(35)
                .requiresPrescription(false)
                .isTemperatureSensitive(false)
                .minTemp(new BigDecimal("8.00"))
                .maxTemp(new BigDecimal("15.00"))
                .storageRequirement("Cool Room (8°C - 15°C)")
                .shelfLocation("Cool Room Storage / Bay B-01")
                .batchNumber("BAT-2026-001")
                .barcode("BC-FA-DTL-250")
                .imageUrl("https://images.unsplash.com/photo-1603555543794-df7a76044bf9?auto=format&fit=crop&q=80&w=400")
                .description("Antiseptic disinfectant liquid for first aid, wound cleaning, and personal hygiene.")
                .rating(new BigDecimal("4.9"))
                .reviewsCount(178)
                .tags("OTC, First Aid, Antiseptic")
                .createdAt(LocalDateTime.now())
                .build());

        // 4. Centrum Advance Multivitamin
        meds.add(Medicine.builder()
                .name("Centrum Advance Multivitamin")
                .genericName("Multivitamins & Minerals")
                .sku("VS-CEN-ADV")
                .category("Vitamins & Nutritional Supplements")
                .unitPrice(new BigDecimal("3500.00"))
                .msrp(new BigDecimal("3900.00"))
                .cogs(new BigDecimal("1700.00"))
                .stockQuantity(110)
                .allocatedStock(8)
                .reorderLevel(25)
                .requiresPrescription(false)
                .isTemperatureSensitive(false)
                .minTemp(new BigDecimal("15.00"))
                .maxTemp(new BigDecimal("25.00"))
                .storageRequirement("Ambient Storage (15°C - 25°C)")
                .shelfLocation("Ambient Storage / Bay A-03")
                .batchNumber("BAT-2026-001")
                .barcode("BC-VS-CEN-ADV")
                .imageUrl("https://images.unsplash.com/photo-1594995855018-8f8373b30e44?auto=format&fit=crop&q=80&w=400")
                .description("Comprehensive daily multivitamin tailored to support adult health and immunity.")
                .rating(new BigDecimal("4.9"))
                .reviewsCount(195)
                .tags("OTC, Vitamins, Supplements, Immunity")
                .createdAt(LocalDateTime.now())
                .build());

        // 5. Omron M3 Blood Pressure Monitor
        meds.add(Medicine.builder()
                .name("Omron M3 Blood Pressure Monitor")
                .genericName("N/A (Digital Sphygmomanometer)")
                .sku("HH-OMR-M3")
                .category("Home Health & medical Care")
                .unitPrice(new BigDecimal("18500.00"))
                .msrp(new BigDecimal("21000.00"))
                .cogs(new BigDecimal("12000.00"))
                .stockQuantity(45)
                .allocatedStock(4)
                .reorderLevel(10)
                .requiresPrescription(false)
                .isTemperatureSensitive(false)
                .minTemp(new BigDecimal("15.00"))
                .maxTemp(new BigDecimal("25.00"))
                .storageRequirement("Ambient Storage (15°C - 25°C)")
                .shelfLocation("Ambient Storage / Bay A-04")
                .batchNumber("BAT-2026-001")
                .barcode("BC-HH-OMR-M3")
                .imageUrl("https://images.unsplash.com/photo-1527613426496-22878f001716?auto=format&fit=crop&q=80&w=400")
                .description("Clinically validated upper arm blood pressure monitor for accurate home tracking.")
                .rating(new BigDecimal("5.0"))
                .reviewsCount(88)
                .tags("Device, Home Health, Cardio")
                .createdAt(LocalDateTime.now())
                .build());

        // 6. Lipitor 20mg
        meds.add(Medicine.builder()
                .name("Lipitor 20mg")
                .genericName("Atorvastatin")
                .sku("RX-LPT-020")
                .category("Prescription Medicines")
                .unitPrice(new BigDecimal("1200.00"))
                .msrp(new BigDecimal("1450.00"))
                .cogs(new BigDecimal("650.00"))
                .stockQuantity(120)
                .allocatedStock(10)
                .reorderLevel(25)
                .requiresPrescription(true)
                .isTemperatureSensitive(true)
                .minTemp(new BigDecimal("2.00"))
                .maxTemp(new BigDecimal("8.00"))
                .storageRequirement("Cold Chain (2°C - 8°C)")
                .shelfLocation("Refrigerated Cold Chain / Bay C-01")
                .batchNumber("BAT-2026-002")
                .barcode("BC-RX-LPT-020")
                .imageUrl("https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=400")
                .description("Cholesterol-lowering medication used to reduce the risk of heart disease.")
                .rating(new BigDecimal("4.8"))
                .reviewsCount(92)
                .tags("Rx, Statin, Cold Chain, Cardio")
                .createdAt(LocalDateTime.now())
                .build());

        // 7. Hansaplast Fabric Plasters
        meds.add(Medicine.builder()
                .name("Hansaplast Fabric Plasters")
                .genericName("N/A (Adhesive Bandage)")
                .sku("FA-HNS-040")
                .category("First Aid & Health Care")
                .unitPrice(new BigDecimal("250.00"))
                .msrp(new BigDecimal("300.00"))
                .cogs(new BigDecimal("120.00"))
                .stockQuantity(300)
                .allocatedStock(25)
                .reorderLevel(50)
                .requiresPrescription(false)
                .isTemperatureSensitive(false)
                .minTemp(new BigDecimal("15.00"))
                .maxTemp(new BigDecimal("25.00"))
                .storageRequirement("Ambient Storage (15°C - 25°C)")
                .shelfLocation("Ambient Storage / Bay A-05")
                .batchNumber("BAT-2026-002")
                .barcode("BC-FA-HNS-040")
                .imageUrl("https://images.pexels.com/photos/4096053/pexels-photo-4096053.jpeg?auto=compress&cs=tinysrgb&w=400")
                .description("Breathable and durable fabric plasters for protecting minor cuts and scrapes.")
                .rating(new BigDecimal("4.7"))
                .reviewsCount(140)
                .tags("OTC, First Aid, Wound Care")
                .createdAt(LocalDateTime.now())
                .build());

        // 8. Seven Seas Cod Liver Oil
        meds.add(Medicine.builder()
                .name("Seven Seas Cod Liver Oil")
                .genericName("Omega-3 & Vitamins A, D, E")
                .sku("VS-SSC-120")
                .category("Vitamins & Nutritional Supplements")
                .unitPrice(new BigDecimal("2800.00"))
                .msrp(new BigDecimal("3200.00"))
                .cogs(new BigDecimal("1400.00"))
                .stockQuantity(90)
                .allocatedStock(5)
                .reorderLevel(20)
                .requiresPrescription(false)
                .isTemperatureSensitive(false)
                .minTemp(new BigDecimal("8.00"))
                .maxTemp(new BigDecimal("15.00"))
                .storageRequirement("Cool Room (8°C - 15°C)")
                .shelfLocation("Cool Room Storage / Bay B-02")
                .batchNumber("BAT-2026-002")
                .barcode("BC-VS-SSC-120")
                .imageUrl("https://images.unsplash.com/photo-1550572620-176840d046c8?auto=format&fit=crop&q=80&w=400")
                .description("Traditional Omega-3 rich fish oil supplement to support heart, brain, and joint health.")
                .rating(new BigDecimal("4.9"))
                .reviewsCount(165)
                .tags("OTC, Omega-3, Vitamins, Fish Oil")
                .createdAt(LocalDateTime.now())
                .build());

        List<Medicine> savedMeds = medicineRepository.saveAll(meds);
        log.info("Saved all {} official medicines in database.", savedMeds.size());

        // Seed 2 Batches
        // Batch 1 (BAT-2026-001): contains first 5 products -> status LIVE
        String batch1Number = "Batch 1 (BAT-2026-001)";
        for (int i = 0; i < 5; i++) {
            Medicine m = savedMeds.get(i);
            InventoryBatch b1 = InventoryBatch.builder()
                    .batchNumber(batch1Number)
                    .medicine(m)
                    .qtyReceived(m.getStockQuantity() + 30)
                    .stockQuantity(m.getStockQuantity())
                    .qtyReserved(m.getAllocatedStock() != null ? m.getAllocatedStock() : 0)
                    .arrivedDate(LocalDate.now().minusWeeks(2))
                    .manufacturingDate(LocalDate.now().minusMonths(3))
                    .expiryDate(LocalDate.now().plusMonths(18))
                    .status(BatchStatus.LIVE)
                    .qcNotes("QC verified and approved for live dispensing.")
                    .qcPassedBy("pharmacist1@gmail.com")
                    .createdAt(LocalDateTime.now().minusWeeks(2))
                    .build();
            inventoryBatchRepository.save(b1);
        }

        // Batch 2 (BAT-2026-002): contains last 3 products -> status COLD_CHAIN_REVIEW
        String batch2Number = "Batch 2 (BAT-2026-002)";
        for (int i = 5; i < 8; i++) {
            Medicine m = savedMeds.get(i);
            InventoryBatch b2 = InventoryBatch.builder()
                    .batchNumber(batch2Number)
                    .medicine(m)
                    .qtyReceived(m.getStockQuantity() + 20)
                    .stockQuantity(m.getStockQuantity())
                    .qtyReserved(m.getAllocatedStock() != null ? m.getAllocatedStock() : 0)
                    .arrivedDate(LocalDate.now().minusDays(3))
                    .manufacturingDate(LocalDate.now().minusMonths(1))
                    .expiryDate(LocalDate.now().plusMonths(24))
                    .status(BatchStatus.COLD_CHAIN_REVIEW)
                    .qcNotes("Awaiting Chief Pharmacist cold chain & condition tagging review.")
                    .qcPassedBy(null)
                    .createdAt(LocalDateTime.now().minusDays(3))
                    .build();
            inventoryBatchRepository.save(b2);
        }
        log.info("Seeded 2 Batches: Batch 1 (5 products, LIVE) and Batch 2 (3 products, COLD_CHAIN_REVIEW).");

        // Seed Cold Chain Tags for all 8 items
        for (int i = 0; i < savedMeds.size(); i++) {
            Medicine m = savedMeds.get(i);
            ColdChainSection section;
            MedicineIntensity intensity;
            SecurityLevel sec;
            BigDecimal minTemp;
            BigDecimal maxTemp;
            String actions;
            String status;
            String reviewedBy;
            LocalDateTime reviewedAt;

            if (i < 5) {
                // Batch 1 items - APPROVED
                status = "APPROVED";
                reviewedBy = "pharmacist1@gmail.com";
                reviewedAt = LocalDateTime.now().minusWeeks(2);
            } else {
                // Batch 2 items - PENDING_REVIEW
                status = "PENDING_REVIEW";
                reviewedBy = null;
                reviewedAt = null;
            }

            if (i == 0) {
                section = ColdChainSection.AMBIENT;
                intensity = MedicineIntensity.LOW;
                sec = SecurityLevel.STANDARD;
                minTemp = new BigDecimal("15.00");
                maxTemp = new BigDecimal("25.00");
                actions = "Standard Ambient Packaging, Keep Dry";
            } else if (i == 1) {
                section = ColdChainSection.AMBIENT;
                intensity = MedicineIntensity.LOW;
                sec = SecurityLevel.STANDARD;
                minTemp = new BigDecimal("15.00");
                maxTemp = new BigDecimal("25.00");
                actions = "Standard Ambient Packaging";
            } else if (i == 2) {
                section = ColdChainSection.COOL_ROOM;
                intensity = MedicineIntensity.MEDIUM;
                sec = SecurityLevel.STANDARD;
                minTemp = new BigDecimal("8.00");
                maxTemp = new BigDecimal("15.00");
                actions = "Insulated Bubble Wrap, Single Cold Pad, Avoid Sunlight";
            } else if (i == 3) {
                section = ColdChainSection.AMBIENT;
                intensity = MedicineIntensity.LOW;
                sec = SecurityLevel.STANDARD;
                minTemp = new BigDecimal("15.00");
                maxTemp = new BigDecimal("25.00");
                actions = "Standard Ambient Packaging, Keep in cool dry place";
            } else if (i == 4) {
                section = ColdChainSection.AMBIENT;
                intensity = MedicineIntensity.LOW;
                sec = SecurityLevel.STANDARD;
                minTemp = new BigDecimal("15.00");
                maxTemp = new BigDecimal("25.00");
                actions = "Handle with Care, Fragile Electronic Medical Device";
            } else if (i == 5) {
                section = ColdChainSection.REFRIGERATED;
                intensity = MedicineIntensity.HIGH;
                sec = SecurityLevel.TAMPER_EVIDENT;
                minTemp = new BigDecimal("2.00");
                maxTemp = new BigDecimal("8.00");
                actions = "Insulated Box, Ice Pack, Keep Upright, Signature Required, Max Transit 12h";
            } else if (i == 6) {
                section = ColdChainSection.AMBIENT;
                intensity = MedicineIntensity.LOW;
                sec = SecurityLevel.STANDARD;
                minTemp = new BigDecimal("15.00");
                maxTemp = new BigDecimal("25.00");
                actions = "Standard Ambient Packaging, Keep Dry";
            } else {
                section = ColdChainSection.COOL_ROOM;
                intensity = MedicineIntensity.MEDIUM;
                sec = SecurityLevel.STANDARD;
                minTemp = new BigDecimal("8.00");
                maxTemp = new BigDecimal("15.00");
                actions = "Insulated Bubble Wrap, Single Cold Pad, Avoid Direct Sunlight";
            }

            ColdChainTag tag = ColdChainTag.builder()
                    .medicine(m)
                    .section(section)
                    .storageTempMin(minTemp)
                    .storageTempMax(maxTemp)
                    .shelfLifeDays(730)
                    .intensity(intensity)
                    .securityLevel(sec)
                    .deliveryActions(actions)
                    .status(status)
                    .reviewedBy(reviewedBy)
                    .reviewedAt(reviewedAt)
                    .build();
            coldChainTagRepository.save(tag);
        }
        log.info("Initialized cold chain tags for all 8 medicines.");
    }
}
