package com.mediorder.it25100979_delivery_management.repository;

import com.mediorder.it25100979_delivery_management.entity.CourierProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourierProfileRepository extends JpaRepository<CourierProfile, Long> {
    Optional<CourierProfile> findByUserId(Long userId);
}
