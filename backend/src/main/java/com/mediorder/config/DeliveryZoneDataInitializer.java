package com.mediorder.config;

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
        seedDeliveryZone(1L, "colombo01", "0100", 1, 500.0, 30, LocalDate.of(2026, 9, 18));
        seedDeliveryZone(2L, "colombo14", "1400", 1, 500.0, 30, LocalDate.of(2026, 9, 18));
        seedDeliveryZone(3L, "colombo09", "0900", 0, 1500.0, 120, LocalDate.of(2026, 9, 18));
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
