package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.dto.request.DispensePrescriptionRequest;
import com.mediorder.it25100979_delivery_management.dto.response.DeliveryResponse;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.entity.DeliveryZone;
import com.mediorder.it25100979_delivery_management.enums.CourierCompany;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.exception.InvalidDeliveryStateException;
import com.mediorder.it25100979_delivery_management.exception.PrescriptionRequiredException;
import com.mediorder.it25100979_delivery_management.mapper.DeliveryMapper;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import com.mediorder.it25101923_prescription_management.model.Prescription;
import com.mediorder.it25101923_prescription_management.model.PrescriptionStatus;
import com.mediorder.it25101923_prescription_management.repository.PrescriptionRepository;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.it25102867_batchandstock_management.service.FefoAllocationService;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.Subscription;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionStatus;
import com.mediorder.it25103725_subscription_management_and_refil_care.repository.SubscriptionItemRepository;
import com.mediorder.it25103725_subscription_management_and_refil_care.repository.SubscriptionRepository;
import com.mediorder.it25103725_subscription_management_and_refil_care.service.SubscriptionService;
import com.mediorder.it25103946_order_processing_and_workflow.model.Order;
import com.mediorder.it25103946_order_processing_and_workflow.model.OrderStatus;
import com.mediorder.it25103946_order_processing_and_workflow.service.OrderService;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.security.CurrentUserProvider;
import com.mediorder.system_build_functions.service.FeatureFlagService;
import com.mediorder.system_build_functions.service.FeatureKeys;
import com.mediorder.system_build_functions.validation.PhoneNumberValidator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Prescription orders: the customer uploads a prescription, a pharmacist approves it, then the
 * pharmacist picks the medicines from the catalog here. Stock is deducted immediately (FEFO),
 * an Order is created and a delivery enters the Delivery Management approval queue.
 * If that delivery is later rejected/terminated the stock goes back on the shelf
 * (see StockReservationObserver).
 */
@Service
@Transactional
public class PrescriptionDispenseService {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicineRepository medicineRepository;
    private final DeliveryRepository deliveryRepository;
    private final DeliveryLifecycleManager lifecycle;
    private final DeliveryZoneService deliveryZoneService;
    private final OrderService orderService;
    private final FefoAllocationService fefoAllocationService;
    private final CurrentUserProvider currentUserProvider;
    private final FeatureFlagService featureFlagService;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionItemRepository subscriptionItemRepository;
    private final SubscriptionService subscriptionService;

    public PrescriptionDispenseService(PrescriptionRepository prescriptionRepository,
                                       MedicineRepository medicineRepository,
                                       DeliveryRepository deliveryRepository,
                                       DeliveryLifecycleManager lifecycle,
                                       DeliveryZoneService deliveryZoneService,
                                       OrderService orderService,
                                       FefoAllocationService fefoAllocationService,
                                       CurrentUserProvider currentUserProvider,
                                       FeatureFlagService featureFlagService,
                                       SubscriptionRepository subscriptionRepository,
                                       SubscriptionItemRepository subscriptionItemRepository,
                                       SubscriptionService subscriptionService) {
        this.prescriptionRepository = prescriptionRepository;
        this.medicineRepository = medicineRepository;
        this.deliveryRepository = deliveryRepository;
        this.lifecycle = lifecycle;
        this.deliveryZoneService = deliveryZoneService;
        this.orderService = orderService;
        this.fefoAllocationService = fefoAllocationService;
        this.currentUserProvider = currentUserProvider;
        this.featureFlagService = featureFlagService;
        this.subscriptionRepository = subscriptionRepository;
        this.subscriptionItemRepository = subscriptionItemRepository;
        this.subscriptionService = subscriptionService;
    }

    /** A prescription is "used" while any of its orders is not rejected/terminated. */
    public static boolean isActive(Delivery d) {
        DeliveryStatus s = d.getStatusEnum();
        return s != DeliveryStatus.REJECTED && s != DeliveryStatus.TERMINATED;
    }

    public void assertPrescriptionNotUsed(Long prescriptionId) {
        deliveryRepository.findByPrescriptionId(prescriptionId).stream()
                .filter(PrescriptionDispenseService::isActive)
                .findFirst()
                .ifPresent(d -> {
                    throw new InvalidDeliveryStateException("Prescription #" + prescriptionId
                            + " has already been used for delivery #DEL-" + d.getId() + ".");
                });
    }

    public DeliveryResponse dispense(Long prescriptionId, DispensePrescriptionRequest request) {
        featureFlagService.assertFeatureEnabled(FeatureKeys.PRESCRIPTIONS, "Prescription dispensing");
        featureFlagService.assertFeatureEnabled(FeatureKeys.DELIVERY, "Delivery");
        User pharmacist = currentUserProvider.requireCurrentUser();

        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found: " + prescriptionId));
        if (prescription.getStatus() != PrescriptionStatus.APPROVED) {
            throw new PrescriptionRequiredException("Prescription #" + prescriptionId + " is " + prescription.getStatus()
                    + ". Approve it before dispensing.");
        }
        assertPrescriptionNotUsed(prescriptionId);
        User customer = prescription.getCustomer();

        String address = firstNonBlank(request.getDeliveryAddress(), prescription.getDeliveryAddress());
        if (address == null) {
            throw new IllegalArgumentException("Enter the delivery address (the customer did not give one).");
        }
        String phone = firstNonBlank(request.getContactPhone(), prescription.getContactPhone(),
                customer != null ? customer.getPhoneNumber() : null);
        if (phone == null || !PhoneNumberValidator.isValid(phone)) {
            throw new IllegalArgumentException("Enter a valid phone number for the customer, e.g. 0771234567.");
        }
        String courierInput = firstNonBlank(request.getPreferredCourier(), prescription.getPreferredCourier());
        CourierCompany courier = courierInput != null
                ? CourierCompany.fromString(courierInput)
                : CourierCompany.IN_COMPANY_DELIVERY;

        // Medicines picked by the pharmacist (same medicine twice -> one line)
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        request.getItems().forEach(l -> quantities.merge(l.getMedicineId(), l.getQuantity(), Integer::sum));

        String note = request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : null;
        Delivery saved = pickAndSend(customer, pharmacist, quantities, address, phone, courier, note, prescription.getId(),
                "Prescription #" + prescription.getId() + " dispensed by " + pharmacist.getFullName());
        return DeliveryMapper.toResponse(saved);
    }

    /**
     * Refill subscriptions: the pharmacist sends the next refill. Same picking as a prescription
     * (stock deducted, order + delivery created), then the next refill date moves forward.
     */
    public DeliveryResponse dispenseRefill(Long subscriptionId) {
        featureFlagService.assertFeatureEnabled(FeatureKeys.REFILLS, "Refills");
        featureFlagService.assertFeatureEnabled(FeatureKeys.DELIVERY, "Delivery");
        User pharmacist = currentUserProvider.requireCurrentUser();
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found: " + subscriptionId));
        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new InvalidDeliveryStateException("Subscription #" + subscriptionId + " is " + sub.getStatus()
                    + "; resume it before sending a refill.");
        }
        if (sub.getDeliveryAddress() == null || sub.getDeliveryAddress().isBlank()) {
            throw new IllegalArgumentException("This subscription has no delivery address. Ask the customer to set it up again.");
        }
        String phone = firstNonBlank(sub.getContactPhone(), sub.getCustomer() != null ? sub.getCustomer().getPhoneNumber() : null);
        if (phone == null || !PhoneNumberValidator.isValid(phone)) {
            throw new IllegalArgumentException("This subscription has no valid contact phone.");
        }
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        subscriptionItemRepository.findBySubscriptionId(subscriptionId).forEach(item -> {
            if (item.getMedicine() != null) {
                quantities.merge(item.getMedicine().getId(), item.getQuantity() != null ? item.getQuantity() : 1, Integer::sum);
            }
        });
        if (quantities.isEmpty()) {
            throw new IllegalArgumentException("Subscription #" + subscriptionId + " has no medicines.");
        }
        CourierCompany courier = sub.getPreferredCourier() != null
                ? CourierCompany.fromString(sub.getPreferredCourier())
                : CourierCompany.IN_COMPANY_DELIVERY;

        Delivery saved = pickAndSend(sub.getCustomer(), pharmacist, quantities, sub.getDeliveryAddress().trim(), phone, courier,
                "Refill #SUB-" + subscriptionId, null,
                "Refill for subscription #SUB-" + subscriptionId + " sent by " + pharmacist.getFullName());
        subscriptionService.advanceRefillCycle(subscriptionId);
        return DeliveryMapper.toResponse(saved);
    }

    /** Shared picking: price from catalog, deduct FEFO stock now, create order + PENDING delivery. */
    private Delivery pickAndSend(User customer, User pharmacist, Map<Long, Integer> quantities, String address, String phone,
                                 CourierCompany courier, String note, Long prescriptionId, String eventMessage) {
        BigDecimal deliveryFee = deliveryZoneService.checkCity(address)
                .filter(zone -> zone.getIsActive() != null && zone.getIsActive() == 1)
                .map(DeliveryZone::getDeliveryFee)
                .map(BigDecimal::valueOf)
                .orElseThrow(() -> new IllegalArgumentException("This address is outside our delivery zones."));
        List<String> lines = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        boolean coldChain = false;
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            Medicine medicine = medicineRepository.findById(entry.getKey())
                    .orElseThrow(() -> new IllegalArgumentException("Medicine not found: " + entry.getKey()));
            if (entry.getValue() > 100) {
                throw new IllegalArgumentException("At most 100 units of " + medicine.getName() + " per order.");
            }
            BigDecimal price = medicine.getUnitPrice() != null ? medicine.getUnitPrice() : BigDecimal.ZERO;
            subtotal = subtotal.add(price.multiply(BigDecimal.valueOf(entry.getValue())));
            coldChain |= Boolean.TRUE.equals(medicine.getIsTemperatureSensitive());
            lines.add(entry.getValue() + " x " + medicine.getName());
        }
        BigDecimal total = subtotal.add(deliveryFee).setScale(2, RoundingMode.HALF_UP);

        Order order = orderService.createOrder(Order.builder()
                .customer(customer)
                .totalAmount(total)
                .orderStatus(OrderStatus.PLACED)
                .shippingAddress(address)
                .build());

        // Pick from the shelf now: reserve FEFO batches and deduct immediately. Short stock -> 409, all rolled back.
        quantities.forEach((medicineId, qty) -> fefoAllocationService.reserveStockFEFO(order.getId(), medicineId, qty, null));
        fefoAllocationService.confirmOrderStock(order.getId());

        Delivery delivery = Delivery.builder()
                .orderId(order.getId())
                .userId(customer != null ? customer.getId() : null)
                .customerName(customer != null ? customer.getFullName() : "Customer")
                .customerEmail(customer != null ? customer.getEmail() : null)
                .customerPhone(phone)
                .orderAddress(address)
                .itemsSummary(String.join(", ", lines))
                .orderTotal(total)
                .specialInstructions(note)
                .coldChainTag(coldChain)
                .handlingInstructionsSnapshot(coldChain ? "Cold chain: keep at 2-8°C, insulated box with ice pack" : null)
                .validatingPharmacist(pharmacist.getFullName())
                .prescriptionId(prescriptionId)
                .preferredCourier(courier.getDisplayName())
                .status(DeliveryStatus.PENDING.name())
                .build();

        return lifecycle.create(delivery, DeliveryEventType.DELIVERY_REQUESTED,
                eventMessage + " (" + String.join(", ", lines) + ")");
    }

    /** prescriptionId -> its current (non-cancelled) delivery, for the pharmacist dashboard. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> dispensedPrescriptions() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Delivery d : deliveryRepository.findByPrescriptionIdIsNotNull()) {
            if (!isActive(d)) {
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("prescriptionId", d.getPrescriptionId());
            row.put("deliveryId", d.getId());
            row.put("orderId", d.getOrderId());
            row.put("status", d.getStatus());
            row.put("itemsSummary", d.getItemsSummary());
            result.add(row);
        }
        return result;
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }
}
