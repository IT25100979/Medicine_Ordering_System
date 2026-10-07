package com.mediorder.it25100979_delivery_management.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.time.LocalDate;

@Component
public class DeliveryZoneDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DeliveryZoneDataInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public DeliveryZoneDataInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        seedDeliveryZone(1L, "Colombo 01", "0100", 1, 5.0, 30, LocalDate.of(2026, 9, 18));
        seedDeliveryZone(2L, "Colombo 14", "1400", 1, 5.0, 30, LocalDate.of(2026, 9, 18));
        seedDeliveryZone(3L, "Colombo 09", "0900", 0, 15.0, 120, LocalDate.of(2026, 9, 18));
        seedDeliveryZone(4L, "Colombo 03", "0300", 1, 5.0, 35, LocalDate.of(2026, 9, 18));
        seedDeliveryZone(5L, "Colombo 07", "0700", 1, 6.0, 25, LocalDate.of(2026, 9, 18));
        seedDeliveryZone(6L, "New York", "10001", 1, 8.0, 45, LocalDate.of(2026, 9, 18));
        seedDeliveryZone(7L, "Los Angeles", "90001", 1, 9.0, 50, LocalDate.of(2026, 9, 18));
        logger.info("Delivery zones data seeded successfully with requested records.");
    }

    private void seedDeliveryZone(Long id, String city, String postalCode, Integer isActive, Double deliveryFee, Integer estTime, LocalDate createdAt) {
        String sql = "INSERT INTO delivery_zones (id, city, postal_code, is_active, delivery_fee, estimated_delivery_time, esitmated_delivery_time, created_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE city = VALUES(city), postal_code = VALUES(postal_code), is_active = VALUES(is_active), " +
                     "delivery_fee = VALUES(delivery_fee), estimated_delivery_time = VALUES(estimated_delivery_time), " +
                     "esitmated_delivery_time = VALUES(esitmated_delivery_time), created_at = VALUES(created_at)";
        jdbcTemplate.update(sql, id, city, postalCode, isActive, deliveryFee, estTime, estTime, Date.valueOf(createdAt));
    }
}

