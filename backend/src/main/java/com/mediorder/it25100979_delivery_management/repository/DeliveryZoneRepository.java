package com.mediorder.it25100979_delivery_management.repository;

import com.mediorder.it25100979_delivery_management.entity.DeliveryZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, Long> {

    Optional<DeliveryZone> findByCityIgnoreCase(String city);

    Optional<DeliveryZone> findByPostalCodeIgnoreCase(String postalCode);

    @Query("SELECT dz FROM DeliveryZone dz WHERE LOWER(REPLACE(dz.city, ' ', '')) = LOWER(REPLACE(:city, ' ', ''))")
    Optional<DeliveryZone> findByNormalizedCity(@Param("city") String city);

    @Query("SELECT dz FROM DeliveryZone dz WHERE LOWER(REPLACE(dz.city, ' ', '')) = LOWER(REPLACE(:query, ' ', '')) OR LOWER(REPLACE(dz.postalCode, ' ', '')) = LOWER(REPLACE(:query, ' ', '')) OR LOWER(dz.city) LIKE LOWER(CONCAT('%', :query, '%'))")
    Optional<DeliveryZone> findByCityOrPostalCode(@Param("query") String query);
}


