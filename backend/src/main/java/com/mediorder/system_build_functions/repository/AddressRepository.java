package com.mediorder.system_build_functions.repository;

import com.mediorder.system_build_functions.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserIdOrderByIsDefaultShippingDescCreatedAtDesc(Long userId);
    Optional<Address> findByUserIdAndIsDefaultShippingTrue(Long userId);
}
