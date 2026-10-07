package com.mediorder.it25103725_subscription_management_and_refil_care.repository;

import com.mediorder.it25103725_subscription_management_and_refil_care.model.Subscription;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByCustomerId(Long customerId);
    List<Subscription> findByStatus(SubscriptionStatus status);
    List<Subscription> findByNextRefillDateLessThanEqualAndStatus(LocalDate date, SubscriptionStatus status);
}
