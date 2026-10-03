package com.mediorder.repository;

import com.mediorder.model.DeliveryZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, Long> {

    Optional<DeliveryZone> findByCityIgnoreCase(String city);

    @Query("SELECT dz FROM DeliveryZone dz WHERE LOWER(REPLACE(dz.city, ' ', '')) = LOWER(REPLACE(:city, ' ', ''))")
    Optional<DeliveryZone> findByNormalizedCity(@Param("city") String city);
}
