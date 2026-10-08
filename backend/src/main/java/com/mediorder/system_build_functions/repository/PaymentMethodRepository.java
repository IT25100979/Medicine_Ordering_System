package com.mediorder.system_build_functions.repository;

import com.mediorder.system_build_functions.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    List<PaymentMethod> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);
    Optional<PaymentMethod> findByUserIdAndIsDefaultTrue(Long userId);
}
