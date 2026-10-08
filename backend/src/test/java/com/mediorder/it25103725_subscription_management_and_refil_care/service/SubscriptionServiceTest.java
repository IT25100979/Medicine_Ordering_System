package com.mediorder.it25103725_subscription_management_and_refil_care.service;

import com.mediorder.it25103725_subscription_management_and_refil_care.dto.SubscriptionRequest;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.Subscription;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionStatus;
import com.mediorder.it25103725_subscription_management_and_refil_care.repository.SubscriptionRepository;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.model.UserStatus;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubscriptionServiceTest {

    @InjectMocks
    private SubscriptionService subscriptionService;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private UserRepository userRepository;

    private User sampleCustomer;
    private Subscription sampleSub;

    @BeforeEach
    void setUp() {
        sampleCustomer = User.builder()
                .id(1L)
                .email("customer@mediorder.com")
                .fullName("John Doe")
                .role(Role.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleSub = Subscription.builder()
                .id(10L)
                .customer(sampleCustomer)
                .frequencyDays(30)
                .nextRefillDate(LocalDate.now().plusDays(30))
                .status(SubscriptionStatus.ACTIVE)
                .build();
    }

    @Test
    void testGetAllSubscriptions() {
        when(subscriptionRepository.findAll()).thenReturn(List.of(sampleSub));

        List<Subscription> list = subscriptionService.getAllSubscriptions();
        assertEquals(1, list.size());
        assertEquals(10L, list.get(0).getId());
    }

    @Test
    void testCreateSubscription() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        SubscriptionRequest req = new SubscriptionRequest();
        req.setCustomerId(1L);
        req.setFrequencyDays(60);

        Subscription created = subscriptionService.createSubscription(req);
        assertNotNull(created);
        assertEquals(60, created.getFrequencyDays());
        assertEquals(SubscriptionStatus.ACTIVE, created.getStatus());
    }

    @Test
    void testUpdateStatus() {
        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(sampleSub));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        Optional<Subscription> updated = subscriptionService.updateStatus(10L, SubscriptionStatus.PAUSED);
        assertTrue(updated.isPresent());
        assertEquals(SubscriptionStatus.PAUSED, updated.get().getStatus());
    }

    @Test
    void testAdvanceRefillCycle() {
        LocalDate initialDate = LocalDate.of(2026, 10, 10);
        sampleSub.setNextRefillDate(initialDate);
        sampleSub.setFrequencyDays(30);

        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(sampleSub));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        Optional<Subscription> advanced = subscriptionService.advanceRefillCycle(10L);
        assertTrue(advanced.isPresent());
        assertEquals(initialDate.plusDays(30), advanced.get().getNextRefillDate());
    }
}
