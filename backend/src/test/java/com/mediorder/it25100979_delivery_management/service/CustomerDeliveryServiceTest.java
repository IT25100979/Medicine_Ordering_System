package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.RecordingObserver;
import com.mediorder.it25100979_delivery_management.dto.request.CustomerDeliveryRequest;
import com.mediorder.it25100979_delivery_management.dto.request.CustomerDeliveryRequest.OrderLine;
import com.mediorder.it25100979_delivery_management.dto.response.CustomerDeliveryResponse;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.entity.DeliveryZone;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.exception.DeliveryNotFoundException;
import com.mediorder.it25100979_delivery_management.observer.DeliveryEventPublisher;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import com.mediorder.it25100979_delivery_management.repository.DeliveryTimelineRepository;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.it25103946_order_processing_and_workflow.model.Order;
import com.mediorder.it25103946_order_processing_and_workflow.service.OrderService;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CustomerDeliveryServiceTest {

    @Mock private DeliveryRepository deliveryRepository;
    @Mock private DeliveryTimelineRepository timelineRepository;
    @Mock private DeliveryZoneService deliveryZoneService;
    @Mock private CurrentUserProvider currentUserProvider;
    @Mock private OrderService orderService;
    @Mock private MedicineRepository medicineRepository;
    @Mock private com.mediorder.system_build_functions.service.FeatureFlagService featureFlagService;

    private RecordingObserver observer;
    private CustomerDeliveryService service;
    private User customer;

    @BeforeEach
    void setUp() {
        observer = new RecordingObserver();
        DeliveryLifecycleManager lifecycle = new DeliveryLifecycleManager(
                deliveryRepository, new DeliveryEventPublisher(List.of(observer)), currentUserProvider);
        service = new CustomerDeliveryService(deliveryRepository, timelineRepository, lifecycle,
                deliveryZoneService, currentUserProvider, orderService, medicineRepository, featureFlagService);

        customer = User.builder().id(1L).fullName("customer1").email("customer1@gmail.com").role(Role.CUSTOMER).build();
        when(currentUserProvider.currentUser()).thenReturn(Optional.of(customer));
        when(currentUserProvider.requireCurrentUser()).thenReturn(customer);
        when(orderService.createOrder(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(500L);
            return o;
        });
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(inv -> {
            Delivery d = inv.getArgument(0);
            d.setId(42L);
            return d;
        });
        when(deliveryZoneService.checkCity(anyString())).thenReturn(Optional.empty());
    }

    private CustomerDeliveryRequest request(String courier, OrderLine... lines) {
        return new CustomerDeliveryRequest(courier, "12 Flower Road, Colombo 07", "0771234567",
                "Call on arrival", new BigDecimal("500"), List.of(lines));
    }

    @Test
    void checkout_createsOrderAndPendingDeliveryWithChosenCourier() {
        Medicine insulin = new Medicine();
        insulin.setId(3L);
        insulin.setName("Insulin Pen");
        insulin.setUnitPrice(new BigDecimal("2000"));
        insulin.setIsTemperatureSensitive(true);
        when(medicineRepository.findById(3L)).thenReturn(Optional.of(insulin));

        // The browser claims a price of 1 - the catalog price must win.
        CustomerDeliveryResponse result = service.requestDelivery(request("koombiyo",
                new OrderLine(3L, "Insulin", 2, new BigDecimal("1")),
                new OrderLine(null, "Gift wrap", 1, new BigDecimal("100"))));

        assertEquals("PENDING", result.getStatus());
        assertEquals("Koombiyo", result.getPreferredCourier());
        assertEquals(500L, result.getOrderId());
        assertEquals(new BigDecimal("4600.00"), result.getOrderTotal()); // 2*2000 + 100 + 500 fee
        assertTrue(result.getColdChainTag());
        assertNull(result.getHandoverOtp(), "no OTP before a courier is assigned");

        ArgumentCaptor<Order> order = ArgumentCaptor.forClass(Order.class);
        verify(orderService).createOrder(order.capture());
        assertSame(customer, order.getValue().getCustomer());

        assertEquals(List.of(DeliveryEventType.DELIVERY_REQUESTED), observer.types());
        assertEquals("CUSTOMER", observer.last().actor().role());
    }

    @Test
    void checkout_usesZoneFeeWhenAddressIsCovered() {
        DeliveryZone zone = new DeliveryZone();
        zone.setIsActive(1);
        zone.setDeliveryFee(350.0);
        when(deliveryZoneService.checkCity(anyString())).thenReturn(Optional.of(zone));

        CustomerDeliveryResponse result = service.requestDelivery(request("DHL",
                new OrderLine(null, "Plasters", 1, new BigDecimal("250"))));

        assertEquals(new BigDecimal("600.00"), result.getOrderTotal());
    }

    @Test
    void checkout_blockedWhenOrderingKillSwitchIsOff() {
        org.mockito.Mockito.doThrow(new IllegalStateException("Service Unavailable: Online ordering is currently disabled."))
                .when(featureFlagService).assertFeatureEnabled(org.mockito.ArgumentMatchers.eq("ORDERING"), anyString());

        assertThrows(IllegalStateException.class, () -> service.requestDelivery(request("DHL",
                new OrderLine(null, "Plasters", 1, new BigDecimal("250")))));
        org.mockito.Mockito.verify(orderService, org.mockito.Mockito.never()).createOrder(any());
    }

    @Test
    void checkout_isOnlyForCustomers() {
        customer.setRole(Role.DELIVERY_COORDINATOR);
        assertThrows(AccessDeniedException.class, () -> service.requestDelivery(request("DHL",
                new OrderLine(null, "Plasters", 1, new BigDecimal("250")))));
    }

    @Test
    void checkout_rejectsUnknownCourier() {
        assertThrows(IllegalArgumentException.class, () -> service.requestDelivery(request("FedEx",
                new OrderLine(null, "Plasters", 1, new BigDecimal("250")))));
    }

    @Test
    void tracking_customerCannotSeeSomeoneElsesDelivery() {
        when(deliveryRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.empty());
        assertThrows(DeliveryNotFoundException.class, () -> service.getMyDelivery(9L));
    }

    @Test
    void tracking_showsOtpOnlyWhileParcelIsWithCourier() {
        Delivery withCourier = Delivery.builder().id(1L).userId(1L).status("IN_TRANSIT").deliveryOtp("654321").build();
        Delivery pending = Delivery.builder().id(2L).userId(1L).status("PENDING").deliveryOtp("111111").build();
        when(deliveryRepository.findByUserIdOrderByIdDesc(1L)).thenReturn(List.of(withCourier, pending));

        List<CustomerDeliveryResponse> mine = service.getMyDeliveries();

        assertEquals("654321", mine.get(0).getHandoverOtp());
        assertNull(mine.get(1).getHandoverOtp());
    }
}
