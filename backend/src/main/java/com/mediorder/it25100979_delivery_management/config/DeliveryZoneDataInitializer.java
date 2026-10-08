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
        try {
            // Remove all existing delivery zones as per specification
            jdbcTemplate.update("DELETE FROM delivery_zones");

            // Seed the exact route data required:
            // City: Colombo 1 - 5 | Postal Code: 0100 - 0500 | Status: Active | Delivery Fee: 500 Rs | Estimated Time: 1 hour (60 mins)
            seedDeliveryRoute(1L, "Colombo 1 - 5", "0100 - 0500", 1, 500.0, 60, LocalDate.now());
            logger.info("Delivery routes seeded successfully with Colombo 1 - 5 exact geofence data.");
        } catch (Exception e) {
            logger.warn("Could not re-initialize delivery routes data: {}", e.getMessage());
        }
    }

    private void seedDeliveryRoute(Long id, String city, String postalCode, Integer isActive, Double deliveryFee, Integer estTime, LocalDate createdAt) {
        String sql = "INSERT INTO delivery_zones (id, city, postal_code, is_active, delivery_fee, estimated_delivery_time, esitmated_delivery_time, created_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE city = VALUES(city), postal_code = VALUES(postal_code), is_active = VALUES(is_active), " +
                     "delivery_fee = VALUES(delivery_fee), estimated_delivery_time = VALUES(estimated_delivery_time), " +
                     "esitmated_delivery_time = VALUES(esitmated_delivery_time), created_at = VALUES(created_at)";
        jdbcTemplate.update(sql, id, city, postalCode, isActive, deliveryFee, estTime, estTime, Date.valueOf(createdAt));
    }
}
