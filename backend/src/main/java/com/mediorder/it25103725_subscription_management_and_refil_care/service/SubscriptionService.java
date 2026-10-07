package com.mediorder.it25103725_subscription_management_and_refil_care.service;

import com.mediorder.it25103725_subscription_management_and_refil_care.dto.SubscriptionRequest;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.Subscription;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionStatus;
import com.mediorder.it25103725_subscription_management_and_refil_care.repository.SubscriptionRepository;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SubscriptionService {

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Subscription> getAllSubscriptions() {
        return subscriptionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Subscription> getSubscriptionsByCustomer(Long customerId) {
        return subscriptionRepository.findByCustomerId(customerId);
    }

    @Transactional(readOnly = true)
    public Optional<Subscription> getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id);
    }

    public Subscription createSubscription(SubscriptionRequest request) {
        Optional<User> userOpt = userRepository.findById(request.getCustomerId());
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Customer not found with id: " + request.getCustomerId());
        }

        LocalDate nextDate = request.getNextRefillDate() != null
                ? request.getNextRefillDate()
                : LocalDate.now().plusDays(request.getFrequencyDays() != null ? request.getFrequencyDays() : 30);

        Subscription subscription = Subscription.builder()
                .customer(userOpt.get())
                .frequencyDays(request.getFrequencyDays() != null ? request.getFrequencyDays() : 30)
                .nextRefillDate(nextDate)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        return subscriptionRepository.save(subscription);
    }

    public Optional<Subscription> updateStatus(Long id, SubscriptionStatus status) {
        return subscriptionRepository.findById(id).map(sub -> {
            sub.setStatus(status);
            return subscriptionRepository.save(sub);
        });
    }

    public Optional<Subscription> advanceRefillCycle(Long id) {
        return subscriptionRepository.findById(id).map(sub -> {
            sub.setNextRefillDate(sub.getNextRefillDate().plusDays(sub.getFrequencyDays()));
            return subscriptionRepository.save(sub);
        });
    }
}
