package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.RecordingObserver;
import com.mediorder.it25100979_delivery_management.dto.request.DispensePrescriptionRequest;
import com.mediorder.it25100979_delivery_management.dto.request.DispensePrescriptionRequest.Line;
import com.mediorder.it25100979_delivery_management.dto.response.DeliveryResponse;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.entity.DeliveryZone;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.exception.InvalidDeliveryStateException;
import com.mediorder.it25100979_delivery_management.exception.PrescriptionRequiredException;
import com.mediorder.it25100979_delivery_management.observer.DeliveryEventPublisher;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import com.mediorder.it25101923_prescription_management.model.Prescription;
import com.mediorder.it25101923_prescription_management.model.PrescriptionStatus;
import com.mediorder.it25101923_prescription_management.repository.PrescriptionRepository;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.it25102867_batchandstock_management.service.FefoAllocationService;
import com.mediorder.it25103946_order_processing_and_workflow.model.Order;
import com.mediorder.it25103946_order_processing_and_workflow.service.OrderService;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.security.CurrentUserProvider;
import com.mediorder.system_build_functions.service.FeatureFlagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PrescriptionDispenseServiceTest {

    @Mock private PrescriptionRepository prescriptionRepository;
    @Mock private MedicineRepository medicineRepository;
    @Mock private DeliveryRepository deliveryRepository;
    @Mock private DeliveryZoneService deliveryZoneService;
    @Mock private OrderService orderService;
    @Mock private FefoAllocationService fefoAllocationService;
    @Mock private CurrentUserProvider currentUserProvider;
    @Mock private FeatureFlagService featureFlagService;
    @Mock private com.mediorder.it25103725_subscription_management_and_refil_care.repository.SubscriptionRepository subscriptionRepository;
    @Mock private com.mediorder.it25103725_subscription_management_and_refil_care.repository.SubscriptionItemRepository subscriptionItemRepository;
    @Mock private com.mediorder.it25103725_subscription_management_and_refil_care.service.SubscriptionService subscriptionService;

    private RecordingObserver observer;
    private PrescriptionDispenseService service;
    private final User customer = User.builder().id(1L).fullName("customer1").email("c@x.com").phoneNumber("0771000001").role(Role.CUSTOMER).build();
    private final User pharmacist = User.builder().id(4L).fullName("pharmacist1").role(Role.CHIEF_PHARMACIST).build();
    private Prescription rx;

    @BeforeEach
    void setUp() {
        observer = new RecordingObserver();
        DeliveryLifecycleManager lifecycle = new DeliveryLifecycleManager(
                deliveryRepository, new DeliveryEventPublisher(List.of(observer)), currentUserProvider);
        service = new PrescriptionDispenseService(prescriptionRepository, medicineRepository, deliveryRepository,
                lifecycle, deliveryZoneService, orderService, fefoAllocationService, currentUserProvider, featureFlagService,
                subscriptionRepository, subscriptionItemRepository, subscriptionService);

        when(currentUserProvider.requireCurrentUser()).thenReturn(pharmacist);
        when(currentUserProvider.currentUser()).thenReturn(Optional.of(pharmacist));
        rx = Prescription.builder().id(7L).customer(customer).status(PrescriptionStatus.APPROVED).build();
        rx.setDeliveryAddress("45 Galle Road, Colombo 03");
        rx.setPreferredCourier("DHL");
        when(prescriptionRepository.findById(7L)).thenReturn(Optional.of(rx));

        Medicine amoxil = new Medicine();
        amoxil.setId(1L);
        amoxil.setName("Amoxil 500mg");
        amoxil.setUnitPrice(new BigDecimal("850"));
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(amoxil));

        DeliveryZone zone = new DeliveryZone();
        zone.setIsActive(1);
        zone.setDeliveryFee(500.0);
        when(deliveryZoneService.checkCity(anyString())).thenReturn(Optional.of(zone));
        when(orderService.createOrder(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(30L);
            return o;
        });
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(inv -> {
            Delivery d = inv.getArgument(0);
            d.setId(40L);
            return d;
        });
    }

    private DispensePrescriptionRequest pick(int qty) {
        DispensePrescriptionRequest req = new DispensePrescriptionRequest();
        req.setItems(List.of(new Line(1L, qty)));
        return req;
    }

    @Test
    void dispense_deductsStockAndQueuesDeliveryWithCustomersDetails() {
        DeliveryResponse result = service.dispense(7L, pick(2));

        assertEquals("PENDING", result.getStatus());
        assertEquals(7L, result.getPrescriptionId());
        assertEquals("DHL", result.getPreferredCourier());
        assertEquals("pharmacist1", result.getValidatingPharmacist());
        assertEquals(new BigDecimal("2200.00"), result.getOrderTotal()); // 2 x 850 + 500
        assertEquals("0771000001", result.getCustomerPhone()); // falls back to the account phone

        InOrder stock = inOrder(fefoAllocationService);
        stock.verify(fefoAllocationService).reserveStockFEFO(30L, 1L, 2, null);
        stock.verify(fefoAllocationService).confirmOrderStock(30L); // deducted straight away
        assertEquals(List.of(DeliveryEventType.DELIVERY_REQUESTED), observer.types());
    }

    @Test
    void refill_picksSubscriptionMedicinesAndMovesNextDate() {
        var sub = com.mediorder.it25103725_subscription_management_and_refil_care.model.Subscription.builder()
                .id(9L).customer(customer)
                .status(com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionStatus.ACTIVE).build();
        sub.setDeliveryAddress("45 Galle Road, Colombo 03");
        sub.setContactPhone("0771234567");
        when(subscriptionRepository.findById(9L)).thenReturn(Optional.of(sub));
        var item = new com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionItem();
        Medicine amoxil = medicineRepository.findById(1L).orElseThrow();
        item.setMedicine(amoxil);
        item.setQuantity(3);
        when(subscriptionItemRepository.findBySubscriptionId(9L)).thenReturn(List.of(item));

        DeliveryResponse result = service.dispenseRefill(9L);

        assertEquals("PENDING", result.getStatus());
        assertTrue(result.getItemsSummary().contains("3 x Amoxil 500mg"));
        verify(fefoAllocationService).reserveStockFEFO(30L, 1L, 3, null);
        verify(fefoAllocationService).confirmOrderStock(30L);
        verify(subscriptionService).advanceRefillCycle(9L);
    }

    @Test
    void refill_pausedSubscriptionIsRefused() {
        var sub = com.mediorder.it25103725_subscription_management_and_refil_care.model.Subscription.builder()
                .id(9L).customer(customer)
                .status(com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionStatus.PAUSED).build();
        when(subscriptionRepository.findById(9L)).thenReturn(Optional.of(sub));
        assertThrows(InvalidDeliveryStateException.class, () -> service.dispenseRefill(9L));
        verifyNoInteractions(fefoAllocationService);
    }

    @Test
    void dispense_onlyApprovedPrescriptions() {
        rx.setStatus(PrescriptionStatus.PENDING);
        assertThrows(PrescriptionRequiredException.class, () -> service.dispense(7L, pick(1)));
        verifyNoInteractions(fefoAllocationService);
    }

    @Test
    void dispense_prescriptionCanOnlyBeUsedOnce() {
        Delivery existing = Delivery.builder().id(39L).prescriptionId(7L).status("APPROVED").build();
        when(deliveryRepository.findByPrescriptionId(7L)).thenReturn(List.of(existing));
        assertThrows(InvalidDeliveryStateException.class, () -> service.dispense(7L, pick(1)));

        existing.setStatus("REJECTED"); // a rejected order frees the prescription again
        assertDoesNotThrow(() -> service.dispense(7L, pick(1)));
    }

    @Test
    void dispense_needsAnAddressInsideADeliveryZone() {
        rx.setDeliveryAddress(null);
        assertThrows(IllegalArgumentException.class, () -> service.dispense(7L, pick(1)));

        rx.setDeliveryAddress("Main Street, Jaffna");
        when(deliveryZoneService.checkCity(anyString())).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.dispense(7L, pick(1)));
        verify(orderService, never()).createOrder(any());
    }
}
