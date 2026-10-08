package com.mediorder.it25101882_cold_chain_tagging.repository;

import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainTelemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ColdChainTelemetryRepository extends JpaRepository<ColdChainTelemetry, Long> {
    List<ColdChainTelemetry> findByDeliveryId(Long deliveryId);
    List<ColdChainTelemetry> findByDeviceId(String deviceId);
    List<ColdChainTelemetry> findByBreachFlagTrue();
}
