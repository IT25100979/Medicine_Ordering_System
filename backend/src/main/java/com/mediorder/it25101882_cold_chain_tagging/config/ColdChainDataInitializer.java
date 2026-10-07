package com.mediorder.it25101882_cold_chain_tagging.config;

import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainDelivery;
import com.mediorder.it25101882_cold_chain_tagging.repository.ColdChainRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ColdChainDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(ColdChainDataInitializer.class);

    private final ColdChainRepository repository;

    public ColdChainDataInitializer(ColdChainRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() == 0) {
            logger.info("No cold-chain records found in MySQL. Seeding initial demonstration records...");

            ColdChainDelivery d1 = ColdChainDelivery.builder()
                    .orderId("ORD-1001")
                    .medicationName("Insulin Glargine (100 units/mL)")
                    .temperatureSensitive(true)
                    .minTemperature(2.00)
                    .maxTemperature(8.00)
                    .currentTemperature(5.00)
                    .ageVerificationRequired(false)
                    .minimumAge(null)
                    .courierName("Alex Rivera")
                    .packageType("Insulated Cooler Box")
                    .deliveryStatus("Ready for Delivery")
                    .ageVerificationStatus("Not Required")
                    .temperatureStatus("SAFE")
                    .notes("Standard refrigerated shipment dispatched with gel ice-packs.")
                    .createdAt(LocalDateTime.now())
                    .build();

            ColdChainDelivery d2 = ColdChainDelivery.builder()
                    .orderId("ORD-1002")
                    .medicationName("Controlled Liquid Biologic")
                    .temperatureSensitive(true)
                    .minTemperature(2.00)
                    .maxTemperature(8.00)
                    .currentTemperature(6.00)
                    .ageVerificationRequired(true)
                    .minimumAge(18)
                    .courierName("David Chen")
                    .packageType("Secure Lockbox Cooler")
                    .deliveryStatus("Awaiting Verification")
                    .ageVerificationStatus("Pending")
                    .temperatureStatus("SAFE")
                    .notes("Requires recipient age check (18+) before handover at doorstep.")
                    .createdAt(LocalDateTime.now())
                    .build();

            ColdChainDelivery d3 = ColdChainDelivery.builder()
                    .orderId("ORD-1003")
                    .medicationName("Meningococcal Vaccine")
                    .temperatureSensitive(true)
                    .minTemperature(2.00)
                    .maxTemperature(8.00)
                    .currentTemperature(10.50)
                    .ageVerificationRequired(false)
                    .minimumAge(null)
                    .courierName("Sarah Miller")
                    .packageType("Refrigerated Padded Bag")
                    .deliveryStatus("HOLD")
                    .ageVerificationStatus("Not Required")
                    .temperatureStatus("BREACH")
                    .notes("[TEMPERATURE EXCURSION DETECTED: 10.5°C outside 2.0°C-8.0°C] Package exceeds safe 8°C ceiling. Dispatch halted.")
                    .createdAt(LocalDateTime.now())
                    .build();

            ColdChainDelivery d4 = ColdChainDelivery.builder()
                    .orderId("ORD-1004")
                    .medicationName("Controlled Narcotic Analgesic")
                    .temperatureSensitive(true)
                    .minTemperature(2.00)
                    .maxTemperature(8.00)
                    .currentTemperature(4.20)
                    .ageVerificationRequired(true)
                    .minimumAge(21)
                    .courierName("Michael Torres")
                    .packageType("Tamper-Evident Cooler")
                    .deliveryStatus("RETURN TO PHARMACY")
                    .ageVerificationStatus("Failed")
                    .temperatureStatus("SAFE")
                    .notes("Age verification failed. Package must be returned to pharmacy.")
                    .createdAt(LocalDateTime.now())
                    .build();

            repository.saveAll(List.of(d1, d2, d3, d4));
            logger.info("Successfully seeded 4 demonstration cold-chain records.");
        }
    }
}
