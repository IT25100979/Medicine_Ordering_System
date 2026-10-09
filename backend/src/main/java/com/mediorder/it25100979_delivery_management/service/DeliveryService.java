package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.dto.request.*;
import com.mediorder.it25100979_delivery_management.dto.response.CourierDeliveryResponse;
import com.mediorder.it25100979_delivery_management.dto.response.DeliveryResponse;
import com.mediorder.it25100979_delivery_management.dto.response.DeliveryTimelineResponse;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.enums.CourierCompany;
import com.mediorder.it25100979_delivery_management.enums.DeliveryActionType;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.exception.InvalidDeliveryStateException;
import com.mediorder.it25100979_delivery_management.exception.InvalidOtpException;
import com.mediorder.it25100979_delivery_management.mapper.DeliveryMapper;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import com.mediorder.it25100979_delivery_management.repository.DeliveryTimelineRepository;
import com.mediorder.system_build_functions.service.FeatureFlagService;
import com.mediorder.system_build_functions.service.FeatureKeys;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Delivery Management (coordinator) and courier operations.
 *
 * Workflow: PENDING --approve--> APPROVED --assign courier--> DISPATCHED
 *           --courier picks up--> IN_TRANSIT --customer OTP--> DELIVERED
 *
 * Status changes go through {@link DeliveryLifecycleManager}, which publishes an event
 * to the observers (timeline, order sync, audit, live dashboard, notifications).
 */
@Service
@Transactional
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryTimelineRepository timelineRepository;
    private final DeliveryLifecycleManager lifecycle;
    private final DeliveryOtpService otpService;
    private final FeatureFlagService featureFlagService;

    public DeliveryService(DeliveryRepository deliveryRepository,
                           DeliveryTimelineRepository timelineRepository,
                           DeliveryLifecycleManager lifecycle,
                           DeliveryOtpService otpService,
                           FeatureFlagService featureFlagService) {
        this.deliveryRepository = deliveryRepository;
        this.timelineRepository = timelineRepository;
        this.lifecycle = lifecycle;
        this.otpService = otpService;
        this.featureFlagService = featureFlagService;
    }

    /** System Admin "DELIVERY" kill switch blocks dispatching work (viewing still works). */
    private void assertDeliveryEnabled() {
        featureFlagService.assertFeatureEnabled(FeatureKeys.DELIVERY, "Delivery dispatching");
    }

    // ------------------------------------------------------------------ queries

    @Transactional(readOnly = true)
    public List<DeliveryResponse> getAllDeliveries(String statusFilter) {
        List<Delivery> deliveries;
        if (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("ALL")) {
            deliveries = deliveryRepository.findByStatusOrderByIdDesc(DeliveryStatus.from(statusFilter).name());
        } else {
            deliveries = deliveryRepository.findAllByOrderByIdDesc();
        }
        return deliveries.stream().map(DeliveryMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DeliveryResponse getDeliveryById(Long id) {
        return DeliveryMapper.toResponse(lifecycle.load(id));
    }

    @Transactional(readOnly = true)
    public List<DeliveryTimelineResponse> getTimeline(Long id) {
        lifecycle.load(id); // 404 if it does not exist
        return timelineRepository.findByDeliveryIdOrderByCreatedAtAscIdAsc(id).stream()
                .map(DeliveryMapper::toTimelineResponse)
                .toList();
    }

    // ------------------------------------------------------------ coordinator

    /** Staff-recorded delivery (phone orders etc.). Enters the same approval queue as customer requests. */
    public DeliveryResponse createDelivery(DeliveryCreationRequest request) {
        String courier = request.getAssignedCourier() != null && !request.getAssignedCourier().isBlank()
                ? CourierCompany.fromString(request.getAssignedCourier()).getDisplayName()
                : null;

        Delivery delivery = Delivery.builder()
                .customerName(request.getCustomerName().trim())
                .orderAddress(request.getOrderAddress().trim())
                .customerPhone(request.getCustomerPhone().trim())
                .customerEmail(blankToNull(request.getCustomerEmail()))
                .specialInstructions(blankToNull(request.getSpecialInstructions()))
                .validatingPharmacist(blankToNull(request.getValidatingPharmacist()))
                .arrangingStaff(blankToNull(request.getArrangingStaff()))
                .assignedRoute(blankToNull(request.getAssignedRoute()))
                .preferredCourier(courier)
                .coldChainTag(Boolean.TRUE.equals(request.getColdChainTag())
                        || mentionsColdChain(request.getSpecialInstructions()))
                .status(DeliveryStatus.PENDING.name())
                .build();

        Delivery saved = lifecycle.create(delivery, DeliveryEventType.DELIVERY_RECORDED,
                "Delivery recorded by staff for " + delivery.getCustomerName());
        return DeliveryMapper.toResponse(saved);
    }

    public DeliveryResponse approveDelivery(Long id, DeliveryApprovalRequest request) {
        assertDeliveryEnabled();
        Delivery delivery = lifecycle.load(id);
        delivery.setApprovedBy(lifecycle.currentActor().name());
        delivery.setApprovedAt(LocalDateTime.now());
        delivery.setActionStatus(null);
        delivery.setActionReason(null);

        String note = request != null ? blankToNull(request.getNote()) : null;
        String message = "Delivery approved" + (note != null ? ": " + note : "")
                + ". Preferred courier: " + valueOr(delivery.getPreferredCourier(), "not specified");
        return DeliveryMapper.toResponse(
                lifecycle.transition(delivery, DeliveryStatus.APPROVED, DeliveryEventType.DELIVERY_APPROVED, message));
    }

    public DeliveryResponse rejectDelivery(Long id, DeliveryRejectionRequest request) {
        Delivery delivery = lifecycle.load(id);
        String reason = request.getReason().trim();
        delivery.setActionStatus(DeliveryStatus.REJECTED.name());
        delivery.setActionReason(reason);
        return DeliveryMapper.toResponse(lifecycle.transition(delivery, DeliveryStatus.REJECTED,
                DeliveryEventType.DELIVERY_REJECTED, "Delivery request rejected: " + reason));
    }

    /**
     * Assigns a courier to APPROVED deliveries (or re-assigns DISPATCHED / FAILED ones).
     * If no courier is given, each delivery is assigned to the partner the customer selected.
     * Issues the customer's handover OTP.
     */
    public List<DeliveryResponse> assignDeliveries(AssignDeliveryRequest request) {
        assertDeliveryEnabled();
        List<Long> ids = request.resolveDeliveryIds();
        if (ids.isEmpty()) {
            throw new IllegalArgumentException("At least one deliveryId must be provided for assignment");
        }

        String batchId = blankToNull(request.getBatchId());
        if (batchId == null && ids.size() > 1) {
            batchId = "BATCH-" + System.currentTimeMillis();
        }
        String requestedCourier = request.getCourier() != null && !request.getCourier().isBlank()
                ? CourierCompany.fromString(request.getCourier()).getDisplayName()
                : null;

        List<DeliveryResponse> updated = new ArrayList<>();
        for (Long id : ids) {
            Delivery delivery = lifecycle.load(id);
            DeliveryStatus current = delivery.getStatusEnum();
            if (current == DeliveryStatus.PENDING) {
                throw new InvalidDeliveryStateException(
                        "Delivery #" + id + " must be approved before a courier can be assigned.");
            }

            String courier = requestedCourier != null ? requestedCourier : delivery.getPreferredCourier();
            if (courier == null) {
                throw new IllegalArgumentException(
                        "Delivery #" + id + " has no preferred courier; please choose a courier partner.");
            }

            delivery.setAssignedCourier(courier);
            if (request.getRoute() != null && !request.getRoute().isBlank()) {
                delivery.setAssignedRoute(request.getRoute().trim());
            }
            if (batchId != null) {
                delivery.setBatchId(batchId);
            }
            delivery.setDispatchedAt(LocalDateTime.now());
            delivery.setActionStatus(null);
            delivery.setActionReason(null);
            otpService.issue(delivery);

            String message = (current == DeliveryStatus.APPROVED ? "Courier assigned: " : "Courier re-assigned: ")
                    + courier + (delivery.getAssignedRoute() != null ? " on route " + delivery.getAssignedRoute() : "");
            updated.add(DeliveryMapper.toResponse(lifecycle.transition(
                    delivery, DeliveryStatus.DISPATCHED, DeliveryEventType.COURIER_ASSIGNED, message)));
        }
        return updated;
    }

    /** HOLD / POSTPONE / TERMINATE / RESUME. */
    public DeliveryResponse performAction(Long id, DeliveryActionRequest request) {
        Delivery delivery = lifecycle.load(id);
        DeliveryActionType action = DeliveryActionType.from(request.getAction());
        String reason = blankToNull(request.getReason());

        if (action == DeliveryActionType.TERMINATE && reason == null) {
            throw new IllegalArgumentException("A reason is required to terminate a delivery");
        }

        if (action == DeliveryActionType.RESUME) {
            DeliveryStatus current = delivery.getStatusEnum();
            if (current != DeliveryStatus.ON_HOLD && current != DeliveryStatus.POSTPONED) {
                throw new InvalidDeliveryStateException("Only deliveries that are on hold or postponed can be resumed.");
            }
            DeliveryStatus target = delivery.getApprovedAt() != null ? DeliveryStatus.APPROVED : DeliveryStatus.PENDING;
            delivery.setActionStatus(null);
            delivery.setActionReason(null);
            return DeliveryMapper.toResponse(lifecycle.transition(delivery, target, DeliveryEventType.RESUMED,
                    "Delivery resumed" + (reason != null ? ": " + reason : "") + " (back to " + target.getLabel() + ")"));
        }

        DeliveryStatus target = action.getTargetStatus();
        DeliveryEventType eventType = switch (action) {
            case HOLD -> DeliveryEventType.PUT_ON_HOLD;
            case POSTPONE -> DeliveryEventType.POSTPONED;
            default -> DeliveryEventType.TERMINATED;
        };
        delivery.setActionStatus(target.name());
        delivery.setActionReason(reason);
        if (target == DeliveryStatus.TERMINATED) {
            otpService.consume(delivery);
        }
        return DeliveryMapper.toResponse(lifecycle.transition(delivery, target, eventType,
                target.getLabel() + (reason != null ? ": " + reason : "")));
    }

    /** Issues a new OTP (e.g. the old one expired or the courier was locked out). */
    public DeliveryResponse regenerateOtp(Long id) {
        Delivery delivery = lifecycle.load(id);
        DeliveryStatus status = delivery.getStatusEnum();
        if (status != DeliveryStatus.DISPATCHED && status != DeliveryStatus.IN_TRANSIT) {
            throw new InvalidDeliveryStateException(
                    "An OTP can only be regenerated while the delivery is with the courier.");
        }
        otpService.issue(delivery);
        return DeliveryMapper.toResponse(lifecycle.record(delivery, DeliveryEventType.OTP_REGENERATED,
                "A new handover OTP was issued to the customer"));
    }

    public void deleteDelivery(Long id) {
        Delivery delivery = lifecycle.load(id);
        if (!delivery.getStatusEnum().isFinal() && delivery.getStatusEnum() != DeliveryStatus.PENDING) {
            throw new InvalidDeliveryStateException(
                    "Only pending or closed deliveries can be deleted. Terminate it first.");
        }
        deliveryRepository.delete(delivery);
    }

    // ----------------------------------------------------------------- courier

    @Transactional(readOnly = true)
    public List<CourierDeliveryResponse> getCourierDeliveries(String courier) {
        List<Delivery> list;
        if (courier != null && !courier.isBlank() && !courier.equalsIgnoreCase("ALL")) {
            String name = CourierCompany.fromString(courier).getDisplayName();
            list = deliveryRepository.findByAssignedCourierOrderByIdDesc(name);
        } else {
            list = deliveryRepository.findAllByOrderByIdDesc();
        }
        // Couriers only see parcels that have been handed to them.
        return list.stream()
                .filter(d -> d.getAssignedCourier() != null)
                .filter(d -> switch (d.getStatusEnum()) {
                    case DISPATCHED, IN_TRANSIT, DELIVERED, FAILED -> true;
                    default -> false;
                })
                .map(DeliveryMapper::toCourierResponse)
                .toList();
    }

    /**
     * Courier progress: IN_TRANSIT (picked up), FAILED (with reason) or DELIVERED (needs the customer's OTP).
     * Wrong OTP attempts are saved even though the request fails, hence noRollbackFor.
     */
    @Transactional(noRollbackFor = InvalidOtpException.class)
    public CourierDeliveryResponse updateCourierStatus(Long id, CourierStatusUpdateRequest request) {
        assertDeliveryEnabled();
        Delivery delivery = lifecycle.load(id);
        DeliveryStatus target = DeliveryStatus.from(request.getStatus());

        switch (target) {
            case IN_TRANSIT -> lifecycle.transition(delivery, DeliveryStatus.IN_TRANSIT,
                    DeliveryEventType.OUT_FOR_DELIVERY,
                    "Parcel picked up by " + valueOr(delivery.getAssignedCourier(), "courier") + " and out for delivery");
            case FAILED -> {
                String reason = valueOr(blankToNull(request.getFailureReason()), "Customer unreachable / delivery issue");
                delivery.setActionStatus(DeliveryStatus.FAILED.name());
                delivery.setActionReason(reason);
                lifecycle.transition(delivery, DeliveryStatus.FAILED, DeliveryEventType.DELIVERY_FAILED,
                        "Delivery attempt failed: " + reason);
            }
            case DELIVERED -> completeWithOtp(delivery, request.getOtp());
            default -> throw new IllegalArgumentException(
                    "Invalid status for courier update: " + target + ". Allowed: IN_TRANSIT, FAILED, DELIVERED");
        }
        return DeliveryMapper.toCourierResponse(delivery);
    }

    private void completeWithOtp(Delivery delivery, String otp) {
        DeliveryStatus current = delivery.getStatusEnum();
        if (!current.canTransitionTo(DeliveryStatus.DELIVERED)) {
            throw new InvalidDeliveryStateException(
                    "Delivery #" + delivery.getId() + " must be out for delivery (IN_TRANSIT) before handover.");
        }
        if (otp == null || otp.isBlank()) {
            throw new InvalidOtpException("Customer OTP is required to mark delivery as DELIVERED");
        }

        switch (otpService.verify(delivery, otp)) {
            case VALID -> {
                otpService.consume(delivery);
                delivery.setDeliveredAt(LocalDateTime.now());
                lifecycle.transition(delivery, DeliveryStatus.DELIVERED, DeliveryEventType.DELIVERED,
                        "Parcel handed over and verified with the customer's OTP");
            }
            case INVALID -> {
                lifecycle.record(delivery, DeliveryEventType.OTP_VERIFICATION_FAILED,
                        "Wrong OTP entered by courier (" + otpService.remainingAttempts(delivery) + " attempts left)");
                throw new InvalidOtpException("Invalid OTP. " + otpService.remainingAttempts(delivery)
                        + " attempt(s) remaining.");
            }
            case LOCKED -> {
                if (delivery.getStatusEnum() != DeliveryStatus.FAILED) {
                    delivery.setActionStatus("FAILED_VERIFICATION");
                    delivery.setActionReason("Maximum OTP attempts exceeded");
                    lifecycle.transition(delivery, DeliveryStatus.FAILED, DeliveryEventType.DELIVERY_FAILED,
                            "Delivery locked after " + DeliveryOtpService.MAX_OTP_ATTEMPTS + " wrong OTP attempts");
                }
                throw new InvalidOtpException("Too many wrong OTP attempts. The delivery was marked FAILED; "
                        + "the Delivery Coordinator must re-dispatch it.");
            }
            case EXPIRED -> throw new InvalidOtpException(
                    "The OTP has expired. Ask the Delivery Coordinator to issue a new one.");
            case NOT_ISSUED -> throw new InvalidDeliveryStateException(
                    "No OTP has been issued for this delivery yet.");
        }
    }

    // ----------------------------------------------------------------- helpers

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String valueOr(String value, String fallback) {
        return value != null ? value : fallback;
    }

    private static boolean mentionsColdChain(String text) {
        if (text == null) {
            return false;
        }
        String lower = text.toLowerCase();
        return lower.contains("cold") || lower.contains("refrigerat");
    }
}
