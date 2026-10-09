package com.mediorder.it25103725_subscription_management_and_refil_care.repository;

import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionItemRepository extends JpaRepository<SubscriptionItem, Long> {
    List<SubscriptionItem> findBySubscriptionId(Long subscriptionId);
}
