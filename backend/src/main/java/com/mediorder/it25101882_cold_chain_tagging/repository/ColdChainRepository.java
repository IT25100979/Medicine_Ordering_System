package com.mediorder.it25101882_cold_chain_tagging.repository;

import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for ColdChainDelivery.
 * Provides out-of-the-box CRUD database operations on MySQL table 'cold_chain_deliveries'.
 */
@Repository
public interface ColdChainRepository extends JpaRepository<ColdChainDelivery, Long> {

    // Find record by unique Order ID
    Optional<ColdChainDelivery> findByOrderId(String orderId);

    // Retrieve deliveries by status
    List<ColdChainDelivery> findByDeliveryStatus(String deliveryStatus);

    // Retrieve deliveries by temperature status (e.g. "SAFE", "BREACH")
    List<ColdChainDelivery> findByTemperatureStatus(String temperatureStatus);
}
