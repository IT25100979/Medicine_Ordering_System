package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.dto.request.CustomerDeliveryRequest;
import com.mediorder.it25100979_delivery_management.dto.request.CustomerDeliveryRequest.OrderLine;
import com.mediorder.it25100979_delivery_management.dto.response.CourierPartnerResponse;
import com.mediorder.it25100979_delivery_management.dto.response.CustomerDeliveryResponse;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.entity.DeliveryZone;
import com.mediorder.it25100979_delivery_management.enums.CourierCompany;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.exception.DeliveryNotFoundException;
import com.mediorder.it25100979_delivery_management.exception.PrescriptionRequiredException;
import com.mediorder.it25101923_prescription_management.model.Prescription;
import com.mediorder.it25101923_prescription_management.model.PrescriptionStatus;
import com.mediorder.it25101923_prescription_management.repository.PrescriptionRepository;
import com.mediorder.it25100979_delivery_management.mapper.DeliveryMapper;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import com.mediorder.it25100979_delivery_management.repository.DeliveryTimelineRepository;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.it25102867_batchandstock_management.service.FefoAllocationService;
import com.mediorder.it25103946_order_processing_and_workflow.model.Order;
import com.mediorder.it25103946_order_processing_and_workflow.model.OrderStatus;
import com.mediorder.it25103946_order_processing_and_workflow.service.OrderService;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.security.CurrentUserProvider;
import com.mediorder.system_build_functions.service.FeatureFlagService;
import com.mediorder.system_build_functions.service.FeatureKeys;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Customer side of delivery management:
 * confirm checkout with a chosen courier partner, then track the delivery.
 *
 * Integrates with:
 *  - Order Processing module: an {@link Order} is created and linked to the delivery,
 *  - Batch & Stock module: prices and cold-chain needs come from the catalog, not the browser,
 *  - Delivery zones: the fee comes from the matching route when the address is covered.
 */
@Service
@Transactional
public class CustomerDeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryTimelineRepository timelineRepository;
    private final DeliveryLifecycleManager lifecycle;
    private final DeliveryZoneService deliveryZoneService;
    private final CurrentUserProvider currentUserProvider;
    private final OrderService orderService;
    private final MedicineRepository medicineRepository;
    private final FeatureFlagService featureFlagService;
    private final PrescriptionRepository prescriptionRepository;
    private final FefoAllocationService fefoAllocationService;

    public CustomerDeliveryService(DeliveryRepository deliveryRepository,
                                   DeliveryTimelineRepository timelineRepository,
                                   DeliveryLifecycleManager lifecycle,
                                   DeliveryZoneService deliveryZoneService,
                                   CurrentUserProvider currentUserProvider,
                                   OrderService orderService,
                                   MedicineRepository medicineRepository,
                                   FeatureFlagService featureFlagService,
                                   PrescriptionRepository prescriptionRepository,
                                   FefoAllocationService fefoAllocationService) {
        this.deliveryRepository = deliveryRepository;
        this.timelineRepository = timelineRepository;
        this.lifecycle = lifecycle;
        this.deliveryZoneService = deliveryZoneService;
        this.currentUserProvider = currentUserProvider;
        this.orderService = orderService;
        this.medicineRepository = medicineRepository;
        this.featureFlagService = featureFlagService;
        this.prescriptionRepository = prescriptionRepository;
        this.fefoAllocationService = fefoAllocationService;
    }

    @Transactional(readOnly = true)
    public List<CourierPartnerResponse> getCourierPartners() {
        return Arrays.stream(CourierCompany.values())
                .map(c -> new CourierPartnerResponse(c.name(), c.getDisplayName(), c.getDescription(), c.getEstimatedDays()))
                .toList();
    }

    /**
     * Customer confirms the order with their chosen courier partner.
     * Creates the Order + a PENDING delivery, and the observers push it to the Delivery Management page.
     */
    public CustomerDeliveryResponse requestDelivery(CustomerDeliveryRequest request) {
        // System Admin kill switches: no new orders while ordering or delivery is paused.
        featureFlagService.assertFeatureEnabled(FeatureKeys.ORDERING, "Online ordering");
        featureFlagService.assertFeatureEnabled(FeatureKeys.DELIVERY, "Delivery");
        User customer = currentUserProvider.requireCurrentUser();
        if (customer.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("Only customer accounts can place delivery orders.");
        }

        CourierCompany courier = CourierCompany.fromString(request.getPreferredCourier());
        String address = request.getDeliveryAddress().trim();

        List<String> lines = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        boolean coldChain = false;
        List<String> prescriptionOnlyItems = new ArrayList<>();
        Map<Long, Integer> catalogQuantities = new LinkedHashMap<>();
        for (OrderLine line : request.getItems()) {
            Optional<Medicine> medicine = line.getMedicineId() != null
                    ? medicineRepository.findById(line.getMedicineId())
                    : Optional.empty();
            // The catalog is the price authority; the browser's price is only used for items not in the catalog.
            BigDecimal unitPrice = medicine.map(Medicine::getUnitPrice)
                    .filter(p -> p != null && p.signum() > 0)
                    .orElse(line.getUnitPrice());
            String name = medicine.map(Medicine::getName).orElse(line.getName().trim());
            coldChain |= medicine.map(m -> Boolean.TRUE.equals(m.getIsTemperatureSensitive())).orElse(false);
            medicine.ifPresent(m -> catalogQuantities.merge(m.getId(), line.getQuantity(), Integer::sum));
            if (medicine.map(m -> Boolean.TRUE.equals(m.getRequiresPrescription())).orElse(false)) {
                prescriptionOnlyItems.add(name);
            }

            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(line.getQuantity())));
            lines.add(line.getQuantity() + " x " + name);
        }

        Long prescriptionId = prescriptionOnlyItems.isEmpty()
                ? null
                : requireApprovedPrescription(customer, request.getPrescriptionId(), prescriptionOnlyItems);

        // The delivery fee always comes from the active delivery zone that covers the address
        // (never from the browser); addresses outside every active zone are not accepted.
        BigDecimal deliveryFee = deliveryZoneService.checkCity(address)
                .filter(zone -> zone.getIsActive() != null && zone.getIsActive() == 1)
                .map(DeliveryZone::getDeliveryFee)
                .map(BigDecimal::valueOf)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Sorry, we don't deliver to this address yet. Please include your city, e.g. \"Colombo 03\"."));
        BigDecimal total = subtotal.add(deliveryFee).setScale(2, RoundingMode.HALF_UP);

        // Order Processing module: one order per checkout, linked to the delivery.
        Order order = orderService.createOrder(Order.builder()
                .customer(customer)
                .totalAmount(total)
                .orderStatus(OrderStatus.PLACED)
                .shippingAddress(address)
                .build());

        // Batch & Stock integration: hold stock from the earliest-expiring LIVE batches (FEFO) until the
        // delivery closes. Delivered -> deducted, rejected/terminated -> released (StockReservationObserver).
        // Not enough stock -> 409 and the whole checkout (order included) rolls back.
        catalogQuantities.forEach((medicineId, quantity) ->
                fefoAllocationService.reserveStockFEFO(order.getId(), medicineId, quantity, null));

        String instructions = request.getSpecialInstructions() != null && !request.getSpecialInstructions().isBlank()
                ? request.getSpecialInstructions().trim() : null;

        Delivery delivery = Delivery.builder()
                .orderId(order.getId())
                .userId(customer.getId())
                .customerName(customer.getFullName())
                .customerEmail(customer.getEmail())
                .customerPhone(request.getCustomerPhone().trim())
                .orderAddress(address)
                .itemsSummary(String.join(", ", lines))
                .orderTotal(total)
                .specialInstructions(instructions)
                .coldChainTag(coldChain)
                .handlingInstructionsSnapshot(coldChain ? "Cold chain: keep at 2-8°C, insulated box with ice pack" : null)
                .preferredCourier(courier.getDisplayName())
                .prescriptionId(prescriptionId)
                .status(DeliveryStatus.PENDING.name())
                .build();

        Delivery saved = lifecycle.create(delivery, DeliveryEventType.DELIVERY_REQUESTED,
                "Order #" + order.getId() + " confirmed by customer with courier partner " + courier.getDisplayName());
        return DeliveryMapper.toCustomerResponse(saved, timelineRepository.findByDeliveryIdOrderByCreatedAtAscIdAsc(saved.getId()));
    }

    /**
     * Prescription Management integration: prescription-only medicine can only be ordered against
     * one of the customer's own prescriptions that a pharmacist has APPROVED.
     */
    private Long requireApprovedPrescription(User customer, Long prescriptionId, List<String> prescriptionOnlyItems) {
        String items = String.join(", ", prescriptionOnlyItems);
        if (prescriptionId == null) {
            throw new PrescriptionRequiredException(items + " require(s) an approved prescription. "
                    + "Upload your prescription and choose it at checkout.");
        }
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .filter(p -> p.getCustomer() != null && customer.getId().equals(p.getCustomer().getId()))
                .orElseThrow(() -> new PrescriptionRequiredException("Prescription #" + prescriptionId + " was not found in your account."));
        if (prescription.getStatus() != PrescriptionStatus.APPROVED) {
            throw new PrescriptionRequiredException("Prescription #" + prescriptionId + " is " + prescription.getStatus()
                    + ". Only a pharmacist-approved prescription can be used for " + items + ".");
        }
        return prescription.getId();
    }

    @Transactional(readOnly = true)
    public List<CustomerDeliveryResponse> getMyDeliveries() {
        User customer = currentUserProvider.requireCurrentUser();
        return deliveryRepository.findByUserIdOrderByIdDesc(customer.getId()).stream()
                .map(d -> DeliveryMapper.toCustomerResponse(d,
                        timelineRepository.findByDeliveryIdOrderByCreatedAtAscIdAsc(d.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerDeliveryResponse getMyDelivery(Long id) {
        User customer = currentUserProvider.requireCurrentUser();
        // Looking up by id AND owner means customers can never read someone else's delivery (or OTP).
        Delivery delivery = deliveryRepository.findByIdAndUserId(id, customer.getId())
                .orElseThrow(() -> new DeliveryNotFoundException(id));
        return DeliveryMapper.toCustomerResponse(delivery, timelineRepository.findByDeliveryIdOrderByCreatedAtAscIdAsc(id));
    }
}
