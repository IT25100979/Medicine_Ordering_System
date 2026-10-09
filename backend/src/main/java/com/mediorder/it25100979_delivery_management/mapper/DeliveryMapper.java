package com.mediorder.it25100979_delivery_management.mapper;

import com.mediorder.it25100979_delivery_management.dto.response.CourierDeliveryResponse;
import com.mediorder.it25100979_delivery_management.dto.response.CustomerDeliveryResponse;
import com.mediorder.it25100979_delivery_management.dto.response.DeliveryResponse;
import com.mediorder.it25100979_delivery_management.dto.response.DeliveryTimelineResponse;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.entity.DeliveryTimelineEntry;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/** Converts entities to the response DTOs for each audience (staff, courier, customer). */
public final class DeliveryMapper {

    private DeliveryMapper() {
    }

    public static DeliveryResponse toResponse(Delivery d) {
        DeliveryStatus status = d.getStatusEnum();
        return DeliveryResponse.builder()
                .id(d.getId())
                .orderId(d.getOrderId())
                .userId(d.getUserId())
                .customerName(d.getCustomerName())
                .customerPhone(d.getCustomerPhone())
                .customerEmail(d.getCustomerEmail())
                .orderAddress(address(d))
                .itemsSummary(d.getItemsSummary())
                .prescriptionId(d.getPrescriptionId())
                .orderTotal(d.getOrderTotal())
                .specialInstructions(d.getSpecialInstructions())
                .coldChainTag(Boolean.TRUE.equals(d.getColdChainTag()))
                .validatingPharmacist(d.getValidatingPharmacist())
                .arrangingStaff(d.getArrangingStaff())
                .status(status.name())
                .statusLabel(status.getLabel())
                .preferredCourier(d.getPreferredCourier())
                .assignedCourier(d.getAssignedCourier())
                .assignedRoute(d.getAssignedRoute())
                .batchId(d.getBatchId())
                .approvedBy(d.getApprovedBy())
                .approvedAt(d.getApprovedAt())
                .dispatchedAt(d.getDispatchedAt())
                .deliveredAt(d.getDeliveredAt())
                .actionStatus(d.getActionStatus())
                .actionReason(d.getActionReason())
                .otpIssued(d.getDeliveryOtp() != null)
                .otpAttempts(d.getOtpAttempts())
                .nextStatuses(Arrays.stream(DeliveryStatus.values())
                        .filter(status::canTransitionTo)
                        .map(Enum::name)
                        .toList())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    public static CourierDeliveryResponse toCourierResponse(Delivery d) {
        return CourierDeliveryResponse.builder()
                .deliveryId(d.getId())
                .batchId(d.getBatchId())
                .customerName(d.getCustomerName())
                .orderAddress(address(d))
                .customerPhone(d.getCustomerPhone())
                .status(d.getStatus())
                .assignedCourier(d.getAssignedCourier())
                .assignedRoute(d.getAssignedRoute())
                .specialInstructions(d.getSpecialInstructions())
                .coldChainTag(Boolean.TRUE.equals(d.getColdChainTag()))
                .otpAttempts(d.getOtpAttempts())
                .build();
    }

    public static CustomerDeliveryResponse toCustomerResponse(Delivery d, List<DeliveryTimelineEntry> timeline) {
        DeliveryStatus status = d.getStatusEnum();
        boolean withCourier = status == DeliveryStatus.DISPATCHED || status == DeliveryStatus.IN_TRANSIT;
        boolean otpValid = d.getOtpExpiresAt() == null || d.getOtpExpiresAt().isAfter(LocalDateTime.now());
        boolean showOtp = withCourier && otpValid && d.getDeliveryOtp() != null;

        return CustomerDeliveryResponse.builder()
                .id(d.getId())
                .orderId(d.getOrderId())
                .status(status.name())
                .statusLabel(status.getLabel())
                .preferredCourier(d.getPreferredCourier())
                .assignedCourier(d.getAssignedCourier())
                .orderAddress(address(d))
                .customerPhone(d.getCustomerPhone())
                .itemsSummary(d.getItemsSummary())
                .prescriptionId(d.getPrescriptionId())
                .orderTotal(d.getOrderTotal())
                .coldChainTag(Boolean.TRUE.equals(d.getColdChainTag()))
                .actionReason(d.getActionReason())
                .handoverOtp(showOtp ? d.getDeliveryOtp() : null)
                .otpExpiresAt(showOtp ? d.getOtpExpiresAt() : null)
                .createdAt(d.getCreatedAt())
                .approvedAt(d.getApprovedAt())
                .dispatchedAt(d.getDispatchedAt())
                .deliveredAt(d.getDeliveredAt())
                .timeline(timeline == null ? List.of() : timeline.stream().map(DeliveryMapper::toTimelineResponse).toList())
                .build();
    }

    public static DeliveryTimelineResponse toTimelineResponse(DeliveryTimelineEntry e) {
        return DeliveryTimelineResponse.builder()
                .eventType(e.getEventType())
                .fromStatus(e.getFromStatus())
                .toStatus(e.getToStatus())
                .description(e.getDescription())
                .actorName(e.getActorName())
                .actorRole(e.getActorRole())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private static String address(Delivery d) {
        return d.getOrderAddress() != null ? d.getOrderAddress() : d.getDeliveryAddress();
    }
}
