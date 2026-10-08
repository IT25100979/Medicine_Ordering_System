package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.dto.*;
import com.mediorder.it25100979_delivery_management.model.Delivery;
import com.mediorder.it25100979_delivery_management.model.DeliveryStatus;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @InjectMocks
    private DeliveryService deliveryService;

    private Delivery sampleDelivery;

    @BeforeEach
    void setUp() {
        sampleDelivery = Delivery.builder()
                .id(1L)
                .customerName("John Doe")
                .orderAddress("123 Main St, Colombo 03")
                .customerPhone("0771234567")
                .customerEmail("john@example.com")
                .specialInstructions("Store in cold chain refrigerator")
                .validatingPharmacist("Pharmacist Silva")
                .arrangingStaff("Dispenser Kamal")
                .status(DeliveryStatus.PENDING.name())
                .deliveryOtp("123456")
                .build();
    }

    @Test
    void testCreateDelivery_DefaultsToPendingAndGeneratesOtp() {
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(invocation -> {
            Delivery d = invocation.getArgument(0);
            d.setId(10L);
            return d;
        });

        DeliveryCreationRequest req = new DeliveryCreationRequest();
        req.setCustomerName("Jane Doe");
        req.setOrderAddress("45 Galle Road, Colombo 02");
        req.setCustomerPhone("0719876543");
        req.setSpecialInstructions("Fragile items, keep cold");

        Delivery result = deliveryService.createDelivery(req);

        assertNotNull(result);
        assertEquals("PENDING", result.getStatus());
        assertNotNull(result.getDeliveryOtp());
        assertEquals(6, result.getDeliveryOtp().length());
        assertTrue(result.getColdChainTag());
        verify(deliveryRepository, times(1)).save(any(Delivery.class));
    }

    @Test
    void testAssignDeliveries_TransitionsToDispatched() {
        Delivery d1 = Delivery.builder().id(1L).status("PENDING").build();
        Delivery d2 = Delivery.builder().id(2L).status("PENDING").build();

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(d1));
        when(deliveryRepository.findById(2L)).thenReturn(Optional.of(d2));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));

        AssignDeliveryRequest req = new AssignDeliveryRequest();
        req.setDeliveryIds(Arrays.asList(1L, 2L));
        req.setBatchId("BATCH-101");
        req.setRoute("Colombo 1 - 5");
        req.setCourier("DHL");

        List<Delivery> results = deliveryService.assignDeliveries(req);

        assertEquals(2, results.size());
        for (Delivery d : results) {
            assertEquals("DISPATCHED", d.getStatus());
            assertEquals("Colombo 1 - 5", d.getAssignedRoute());
            assertEquals("DHL", d.getAssignedCourier());
            assertEquals("BATCH-101", d.getBatchId());
        }
        verify(deliveryRepository, times(2)).save(any(Delivery.class));
    }

    @Test
    void testPerformAction_HoldTerminatePostpone() {
        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(sampleDelivery));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));

        // Test HOLD
        Delivery holdResult = deliveryService.performAction(1L, new DeliveryActionRequest("HOLD", "Customer not reachable"));
        assertEquals("ON_HOLD", holdResult.getStatus());
        assertEquals("ON_HOLD", holdResult.getActionStatus());

        // Test TERMINATE
        Delivery termResult = deliveryService.performAction(1L, new DeliveryActionRequest("TERMINATE", "Prescription canceled"));
        assertEquals("TERMINATED", termResult.getStatus());

        // Test POSTPONE
        Delivery postResult = deliveryService.performAction(1L, new DeliveryActionRequest("POSTPONE", "Delivery requested tomorrow"));
        assertEquals("POSTPONED", postResult.getStatus());
    }

    @Test
    void testCourierStatusUpdate_InTransitAndFailedDirectly() {
        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(sampleDelivery));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));

        CourierStatusUpdateRequest transitReq = new CourierStatusUpdateRequest("IN_TRANSIT", null, null);
        CourierDeliveryResponse transitRes = deliveryService.updateCourierStatus(1L, transitReq);
        assertEquals("IN_TRANSIT", transitRes.getStatus());

        CourierStatusUpdateRequest failReq = new CourierStatusUpdateRequest("FAILED", null, "Recipient unavailable");
        CourierDeliveryResponse failRes = deliveryService.updateCourierStatus(1L, failReq);
        assertEquals("FAILED", failRes.getStatus());
    }

    @Test
    void testCourierStatusUpdate_DeliveredWithValidOtp() {
        sampleDelivery.setDeliveryOtp("654321");
        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(sampleDelivery));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));

        CourierStatusUpdateRequest deliverReq = new CourierStatusUpdateRequest("DELIVERED", "654321", null);
        CourierDeliveryResponse deliverRes = deliveryService.updateCourierStatus(1L, deliverReq);

        assertEquals("DELIVERED", deliverRes.getStatus());
        assertEquals("John Doe", deliverRes.getCustomerName());
    }

    @Test
    void testCourierStatusUpdate_DeliveredFailsWithInvalidOtp() {
        sampleDelivery.setDeliveryOtp("654321");
        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(sampleDelivery));

        CourierStatusUpdateRequest wrongOtpReq = new CourierStatusUpdateRequest("DELIVERED", "000000", null);
        assertThrows(ResponseStatusException.class, () -> {
            deliveryService.updateCourierStatus(1L, wrongOtpReq);
        });

        CourierStatusUpdateRequest nullOtpReq = new CourierStatusUpdateRequest("DELIVERED", null, null);
        assertThrows(ResponseStatusException.class, () -> {
            deliveryService.updateCourierStatus(1L, nullOtpReq);
        });
    }

    @Test
    void testGetCourierDeliveries_HidesSensitiveStaffData() {
        sampleDelivery.setAssignedCourier("DHL");
        when(deliveryRepository.findByAssignedCourier("DHL")).thenReturn(List.of(sampleDelivery));

        List<CourierDeliveryResponse> courierList = deliveryService.getCourierDeliveries("DHL");

        assertEquals(1, courierList.size());
        CourierDeliveryResponse item = courierList.get(0);
        assertEquals(1L, item.getDeliveryId());
        assertEquals("John Doe", item.getCustomerName());
        assertEquals("123 Main St, Colombo 03", item.getOrderAddress());
        assertEquals("0771234567", item.getCustomerPhone());
    }
}
