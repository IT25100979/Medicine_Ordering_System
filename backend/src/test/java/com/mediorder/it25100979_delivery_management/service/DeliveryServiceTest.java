package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.RecordingObserver;
import com.mediorder.it25100979_delivery_management.dto.request.*;
import com.mediorder.it25100979_delivery_management.dto.response.CourierDeliveryResponse;
import com.mediorder.it25100979_delivery_management.dto.response.DeliveryResponse;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.exception.InvalidDeliveryStateException;
import com.mediorder.it25100979_delivery_management.exception.InvalidOtpException;
import com.mediorder.it25100979_delivery_management.designe_patter.observer.DeliveryEventPublisher;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import com.mediorder.it25100979_delivery_management.repository.DeliveryTimelineRepository;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;
    @Mock
    private DeliveryTimelineRepository timelineRepository;
    @Mock
    private CurrentUserProvider currentUserProvider;

    private RecordingObserver observer;
    private DeliveryOtpService otpService;
    private DeliveryService deliveryService;

    @BeforeEach
    void setUp() {
        observer = new RecordingObserver();
        otpService = new DeliveryOtpService();
        DeliveryEventPublisher publisher = new DeliveryEventPublisher(List.of(observer));
        DeliveryLifecycleManager lifecycle = new DeliveryLifecycleManager(deliveryRepository, publisher, currentUserProvider);
        deliveryService = new DeliveryService(deliveryRepository, timelineRepository, lifecycle, otpService);

        User coordinator = User.builder().id(5L).fullName("deliverycoordinator1")
                .email("deliverycoordinator1@gmail.com").role(Role.DELIVERY_COORDINATOR).build();
        when(currentUserProvider.currentUser()).thenReturn(Optional.of(coordinator));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(inv -> {
            Delivery d = inv.getArgument(0);
            if (d.getId() == null) {
                d.setId(99L);
            }
            return d;
        });
    }

    private Delivery stored(long id, DeliveryStatus status) {
        Delivery d = Delivery.builder()
                .id(id)
                .customerName("Jane Doe")
                .orderAddress("45 Galle Road, Colombo 03")
                .customerPhone("0719876543")
                .preferredCourier("Koombiyo")
                .status(status.name())
                .build();
        when(deliveryRepository.findById(id)).thenReturn(Optional.of(d));
        return d;
    }

    @Test
    void createDelivery_entersApprovalQueueAndPublishesEvent() {
        DeliveryCreationRequest req = new DeliveryCreationRequest();
        req.setCustomerName("Jane Doe");
        req.setOrderAddress("45 Galle Road, Colombo 02");
        req.setCustomerPhone("0719876543");
        req.setSpecialInstructions("Fragile items, keep cold");
        req.setAssignedCourier("dhl");

        DeliveryResponse result = deliveryService.createDelivery(req);

        assertEquals("PENDING", result.getStatus());
        assertEquals("DHL", result.getPreferredCourier());
        assertTrue(result.getColdChainTag());
        assertFalse(result.isOtpIssued(), "OTP is only issued when a courier is assigned");
        assertEquals(List.of(DeliveryEventType.DELIVERY_RECORDED), observer.types());
        assertNull(observer.last().previousStatus());
    }

    @Test
    void approve_movesPendingToDispatchedAndRecordsApprover() {
        stored(1L, DeliveryStatus.PENDING);

        DeliveryResponse result = deliveryService.approveDelivery(1L, new DeliveryApprovalRequest("Stock verified"));

        assertEquals("DISPATCHED", result.getStatus());
        assertEquals("deliverycoordinator1", result.getApprovedBy());
        assertEquals("Koombiyo", result.getAssignedCourier());
        assertTrue(result.isOtpIssued());
        assertNotNull(result.getApprovedAt());
        assertEquals(DeliveryEventType.COURIER_ASSIGNED, observer.last().type());
        assertEquals(DeliveryStatus.PENDING, observer.last().previousStatus());
        assertEquals("DELIVERY_COORDINATOR", observer.last().actor().role());
    }

    @Test
    void reject_storesReasonAndIsFinal() {
        stored(1L, DeliveryStatus.PENDING);

        DeliveryResponse result = deliveryService.rejectDelivery(1L, new DeliveryRejectionRequest("Address outside coverage"));

        assertEquals("REJECTED", result.getStatus());
        assertEquals("Address outside coverage", result.getActionReason());
        assertTrue(result.getNextStatuses().isEmpty());
    }

    @Test
    void approve_twiceIsRejectedByStateMachine() {
        stored(1L, DeliveryStatus.DELIVERED);
        assertThrows(InvalidDeliveryStateException.class, () -> deliveryService.approveDelivery(1L, null));
    }

    @Test
    void assign_defaultsToCustomersPreferredCourierAndIssuesOtp() {
        Delivery d = stored(1L, DeliveryStatus.APPROVED);
        AssignDeliveryRequest req = new AssignDeliveryRequest();
        req.setDeliveryId(1L);
        req.setRoute("Colombo 1 - 5");

        List<DeliveryResponse> result = deliveryService.assignDeliveries(req);

        assertEquals("DISPATCHED", result.get(0).getStatus());
        assertEquals("Koombiyo", result.get(0).getAssignedCourier());
        assertTrue(result.get(0).isOtpIssued());
        assertEquals(4, d.getDeliveryOtp().length());
        assertNotNull(d.getOtpExpiresAt());
        assertEquals(DeliveryEventType.COURIER_ASSIGNED, observer.last().type());
    }

    @Test
    void assign_multipleGetsSharedBatchCodeAndOverrideCourier() {
        stored(1L, DeliveryStatus.APPROVED);
        stored(2L, DeliveryStatus.APPROVED);
        AssignDeliveryRequest req = new AssignDeliveryRequest();
        req.setDeliveryIds(List.of(1L, 2L, 1L));
        req.setCourier("In Company Delivery");

        List<DeliveryResponse> result = deliveryService.assignDeliveries(req);

        assertEquals(2, result.size(), "duplicate ids are ignored");
        assertNotNull(result.get(0).getBatchId());
        assertEquals(result.get(0).getBatchId(), result.get(1).getBatchId());
        assertTrue(result.stream().allMatch(r -> "In Company Delivery".equals(r.getAssignedCourier())));
    }

    @Test
    void holdThenResume_returnsApprovedDeliveryToApproved() {
        Delivery d = stored(1L, DeliveryStatus.APPROVED);
        d.setApprovedAt(LocalDateTime.now());

        assertEquals("ON_HOLD", deliveryService.performAction(1L, new DeliveryActionRequest("HOLD", "Stock check")).getStatus());
        assertEquals("APPROVED", deliveryService.performAction(1L, new DeliveryActionRequest("RESUME", null)).getStatus());
        assertEquals(List.of(DeliveryEventType.PUT_ON_HOLD, DeliveryEventType.RESUMED), observer.types());
    }

    @Test
    void terminate_requiresReason_andDeliveredCannotBeTerminated() {
        stored(1L, DeliveryStatus.PENDING);
        assertThrows(IllegalArgumentException.class,
                () -> deliveryService.performAction(1L, new DeliveryActionRequest("TERMINATE", " ")));

        stored(2L, DeliveryStatus.DELIVERED);
        assertThrows(InvalidDeliveryStateException.class,
                () -> deliveryService.performAction(2L, new DeliveryActionRequest("TERMINATE", "Customer cancelled")));
    }

    @Test
    void courierFlow_pickUpThenDeliverWithValidOtp() {
        Delivery d = stored(1L, DeliveryStatus.DISPATCHED);
        otpService.issue(d);
        String otp = d.getDeliveryOtp();

        deliveryService.updateCourierStatus(1L, new CourierStatusUpdateRequest("IN_TRANSIT", null, null));
        CourierDeliveryResponse result = deliveryService.updateCourierStatus(1L,
                new CourierStatusUpdateRequest("DELIVERED", otp, null));

        assertEquals("DELIVERED", result.getStatus());
        assertNotNull(d.getDeliveredAt());
        assertNull(d.getDeliveryOtp(), "OTP is single use");
        assertEquals(List.of(DeliveryEventType.OUT_FOR_DELIVERY, DeliveryEventType.DELIVERED), observer.types());
    }

    @Test
    void courierFlow_directDeliverWithValidOtp() {
        Delivery d = stored(1L, DeliveryStatus.DISPATCHED);
        otpService.issue(d);
        String otp = "1234";

        CourierDeliveryResponse result = deliveryService.updateCourierStatus(1L,
                new CourierStatusUpdateRequest("DELIVERED", otp, null));

        assertEquals("DELIVERED", result.getStatus());
        assertNotNull(d.getDeliveredAt());
        assertNull(d.getDeliveryOtp(), "OTP is single use");
        assertEquals(List.of(DeliveryEventType.DELIVERED), observer.types());
    }

    @Test
    void wrongOtp_countsAttemptsAndLocksAfterFive() {
        Delivery d = stored(1L, DeliveryStatus.IN_TRANSIT);
        otpService.issue(d);
        String wrong = "9999";

        for (int i = 1; i <= 4; i++) {
            assertThrows(InvalidOtpException.class, () -> deliveryService.updateCourierStatus(1L,
                    new CourierStatusUpdateRequest("DELIVERED", wrong, null)));
            assertEquals(i, d.getOtpAttempts());
        }
        InvalidOtpException locked = assertThrows(InvalidOtpException.class, () -> deliveryService.updateCourierStatus(1L,
                    new CourierStatusUpdateRequest("DELIVERED", wrong, null)));

        assertTrue(locked.getMessage().contains("Too many wrong OTP attempts"));
        assertEquals("FAILED", d.getStatus());
        assertEquals("FAILED_VERIFICATION", d.getActionStatus());
        assertEquals(DeliveryEventType.DELIVERY_FAILED, observer.last().type());
    }

    @Test
    void courierQueue_onlyShowsParcelsHandedToCouriers() {
        Delivery pending = Delivery.builder().id(1L).status("PENDING").preferredCourier("DHL").build();
        Delivery approved = Delivery.builder().id(2L).status("APPROVED").preferredCourier("DHL").build();
        Delivery dispatched = Delivery.builder().id(3L).status("DISPATCHED").assignedCourier("DHL")
                .customerName("A").deliveryOtp("1234").build();
        when(deliveryRepository.findAllByOrderByIdDesc()).thenReturn(List.of(pending, approved, dispatched));

        List<CourierDeliveryResponse> queue = deliveryService.getCourierDeliveries("ALL");

        assertEquals(1, queue.size());
        assertEquals(3L, queue.get(0).getDeliveryId());
    }
}
