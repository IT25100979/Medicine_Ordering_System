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
        log.info("Initializing global system data, demo users, suppliers, and feature flags...");
        autoMigrateUserSchema();
        seedDemoUsers();
        seedFeatureFlags();
        seedSuppliers();
        seedColdChainTags();
    }

    private void autoMigrateUserSchema() {
        if (jdbcTemplate != null) {
            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL");
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN status VARCHAR(50) NOT NULL");
                log.info("Successfully ensured users table schema has VARCHAR(50) role and status columns.");
            } catch (Exception ex) {
                log.info("User schema auto-migration check completed: {}", ex.getMessage());
            }
        }
    }

    private void seedDemoUsers() {
        seedUser("customer@mediorder.com", "Customer Demo User", Role.CUSTOMER, "0771000001");
        seedUser("pharmacist@mediorder.com", "Dr. John Pharmacist", Role.CHIEF_PHARMACIST, "0771000002");
        seedUser("ops@mediorder.com", "Sarah Operations", Role.OPERATIONS_MANAGER, "0771000003");
        seedUser("delivery@mediorder.com", "Dave Delivery Coordinator", Role.DELIVERY_COORDINATOR, "0771000004");
        seedUser("courier@mediorder.com", "Alex Fleet Rider", Role.DELIVERY_RIDER, "0771000005");
        seedUser("finance@mediorder.com", "Fiona Finance Manager", Role.FINANCE_MANAGER, "0771000006");
        seedUser("it@mediorder.com", "Ian IT Systems Admin", Role.IT_MANAGER, "0771000007");
        seedUser("admin@mediorder.com", "Master System Admin", Role.SYSTEM_ADMIN, "0771000008");
    }

    private void seedUser(String email, String fullName, Role role, String phone) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .passwordHash(passwordEncoder.encode("Password123!"))
                    .phoneNumber(phone)
                    .role(role)
                    .status(UserStatus.ACTIVE)
                    .isDemo(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(user);
            log.info("Seeded demo user: {} ({})", email, role);
        }
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

    private void seedColdChainTags() {
        List<Medicine> medicines = medicineRepository.findAll();
        for (Medicine m : medicines) {
            if (coldChainTagRepository.findByMedicineId(m.getId()).isEmpty()) {
                ColdChainSection section = Boolean.TRUE.equals(m.getIsTemperatureSensitive()) 
                        ? ColdChainSection.REFRIGERATED 
                        : ColdChainSection.AMBIENT;

                MedicineIntensity intensity = Boolean.TRUE.equals(m.getRequiresPrescription()) 
                        ? MedicineIntensity.HIGH 
                        : MedicineIntensity.LOW;

                SecurityLevel sec = Boolean.TRUE.equals(m.getRequiresPrescription()) 
                        ? SecurityLevel.TAMPER_EVIDENT 
                        : SecurityLevel.STANDARD;

                String actions = Boolean.TRUE.equals(m.getIsTemperatureSensitive())
                        ? "Insulated Carrier Box, Dual Cold Gel Packs, Temperature Data Logger, Keep Upright"
                        : "Standard Ambient Packaging";

                ColdChainTag tag = ColdChainTag.builder()
                        .medicine(m)
                        .section(section)
                        .storageTempMin(Boolean.TRUE.equals(m.getIsTemperatureSensitive()) ? new BigDecimal("2.00") : new BigDecimal("15.00"))
                        .storageTempMax(Boolean.TRUE.equals(m.getIsTemperatureSensitive()) ? new BigDecimal("8.00") : new BigDecimal("25.00"))
                        .shelfLifeDays(730)
                        .intensity(intensity)
                        .securityLevel(sec)
                        .deliveryActions(actions)
                        .status("APPROVED")
                        .reviewedBy("Dr. John Pharmacist")
                        .reviewedAt(LocalDateTime.now())
                        .build();

                coldChainTagRepository.save(tag);
            }
        }
        log.info("Initialized cold chain tags for all catalog medicines.");
    }
}
