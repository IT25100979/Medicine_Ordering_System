package com.mediorder.it25103725_subscription_management_and_refil_care.service;

import com.mediorder.it25101923_prescription_management.model.Prescription;
import com.mediorder.it25101923_prescription_management.model.PrescriptionStatus;
import com.mediorder.it25101923_prescription_management.repository.PrescriptionRepository;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.it25103725_subscription_management_and_refil_care.dto.CustomerSubscriptionRequest;
import com.mediorder.it25103725_subscription_management_and_refil_care.dto.SubscriptionRequest.SubscriptionItemDto;
import com.mediorder.it25103725_subscription_management_and_refil_care.dto.SubscriptionView;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.Subscription;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionItem;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionStatus;
import com.mediorder.it25103725_subscription_management_and_refil_care.repository.SubscriptionItemRepository;
import com.mediorder.it25103725_subscription_management_and_refil_care.repository.SubscriptionRepository;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CustomerSubscriptionTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private SubscriptionItemRepository subscriptionItemRepository;
    @Mock private MedicineRepository medicineRepository;
    @Mock private PrescriptionRepository prescriptionRepository;
    @InjectMocks private SubscriptionService service;

    private final User customer = User.builder().id(1L).fullName("customer1").role(Role.CUSTOMER).build();
    private final List<SubscriptionItem> savedItems = new ArrayList<>();

    @BeforeEach
    void setUp() {
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(inv -> {
            Subscription s = inv.getArgument(0);
            if (s.getId() == null) s.setId(10L);
            return s;
        });
        when(subscriptionItemRepository.save(any(SubscriptionItem.class))).thenAnswer(inv -> {
            savedItems.add(inv.getArgument(0));
            return inv.getArgument(0);
        });
        when(subscriptionItemRepository.findBySubscriptionId(10L)).thenReturn(savedItems);
    }

    private Medicine medicine(long id, String name, boolean rx) {
        Medicine m = new Medicine();
        m.setId(id);
        m.setName(name);
        m.setUnitPrice(new BigDecimal("100"));
        m.setRequiresPrescription(rx);
        when(medicineRepository.findById(id)).thenReturn(Optional.of(m));
        return m;
    }

    private CustomerSubscriptionRequest request(long medicineId, int qty) {
        SubscriptionItemDto item = new SubscriptionItemDto();
        item.setMedicineId(medicineId);
        item.setQuantity(qty);
        CustomerSubscriptionRequest req = new CustomerSubscriptionRequest();
        req.setFrequencyDays(30);
        req.setDeliveryAddress("45 Galle Road, Colombo 03");
        req.setContactPhone("0771234567");
        req.setItems(List.of(item));
        return req;
    }

    @Test
    void subscribe_savesTheMedicinesAndReturnsThem() {
        medicine(2L, "Panadol Extra", false);

        SubscriptionView view = service.createForCustomer(customer, request(2L, 3));

        assertEquals("ACTIVE", view.status());
        assertEquals(1, view.items().size());
        assertEquals("Panadol Extra", view.items().get(0).name());
        assertEquals(3, view.items().get(0).quantity());
        assertNotNull(view.nextRefillDate());
        assertEquals("45 Galle Road, Colombo 03", view.deliveryAddress());
    }

    @Test
    void subscribe_prescriptionOnlyMedicineNeedsApprovedPrescription() {
        medicine(1L, "Lipitor 20mg", true);
        assertThrows(IllegalArgumentException.class, () -> service.createForCustomer(customer, request(1L, 1)));

        CustomerSubscriptionRequest withRx = request(1L, 1);
        withRx.setPrescriptionId(5L);
        when(prescriptionRepository.findById(5L)).thenReturn(Optional.of(
                Prescription.builder().id(5L).customer(customer).status(PrescriptionStatus.APPROVED).build()));
        assertEquals("ACTIVE", service.createForCustomer(customer, withRx).status());
    }

    @Test
    void changeStatus_onlyOwnAndCancelledIsFinal() {
        User other = User.builder().id(2L).role(Role.CUSTOMER).build();
        Subscription othersSub = Subscription.builder().id(20L).customer(other).status(SubscriptionStatus.ACTIVE).build();
        Subscription cancelled = Subscription.builder().id(21L).customer(customer).status(SubscriptionStatus.CANCELLED).build();
        when(subscriptionRepository.findById(20L)).thenReturn(Optional.of(othersSub));
        when(subscriptionRepository.findById(21L)).thenReturn(Optional.of(cancelled));

        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> service.changeOwnStatus(customer, 20L, SubscriptionStatus.PAUSED)).getStatusCode().value());
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> service.changeOwnStatus(customer, 21L, SubscriptionStatus.ACTIVE)).getStatusCode().value());
    }
}
