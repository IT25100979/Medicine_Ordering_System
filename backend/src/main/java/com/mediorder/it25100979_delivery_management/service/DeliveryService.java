package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.dto.*;
import com.mediorder.it25100979_delivery_management.model.*;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DeliveryService {

    @Autowired
    private DeliveryRepository deliveryRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generate a 6-digit numeric OTP for customer delivery verification
     */
    public String generateDeliveryOtp() {
        int otpNumber = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(otpNumber);
    }

    /**
     * Create a new delivery (from customer order or operations console).
     * Automatically sets initial state to PENDING and generates a secure customer verification OTP.
     */
    public Delivery createDelivery(DeliveryCreationRequest request) {
        String address = request.getOrderAddress() != null && !request.getOrderAddress().trim().isEmpty()
                ? request.getOrderAddress().trim()
                : (request.getDeliveryAddress() != null ? request.getDeliveryAddress().trim() : "Standard Address");

        boolean isColdChain = Boolean.TRUE.equals(request.getColdChainTag()) ||
                (request.getSpecialInstructions() != null && 
                 (request.getSpecialInstructions().toLowerCase().contains("cold") ||
                  request.getSpecialInstructions().toLowerCase().contains("refrigerat")));

        Delivery delivery = Delivery.builder()
                .customerName(request.getCustomerName() != null ? request.getCustomerName().trim() : "Customer")
                .orderAddress(address)
                .deliveryAddress(address)
                .customerPhone(request.getCustomerPhone())
                .customerEmail(request.getCustomerEmail())
                .specialInstructions(request.getSpecialInstructions())
                .validatingPharmacist(request.getValidatingPharmacist())
                .arrangingStaff(request.getArrangingStaff())
                .batchId(request.getBatchId())
                .assignedRoute(request.getAssignedRoute())
                .assignedCourier(request.getAssignedCourier())
                .status(DeliveryStatus.PENDING.name())
                .deliveryOtp(generateDeliveryOtp())
                .coldChainTag(isColdChain)
                .userId(request.getUserId() != null ? request.getUserId() : 1L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return deliveryRepository.save(delivery);
    }

    /**
     * Compatibility overload for raw Delivery entity saves
     */
    public Delivery createDelivery(Delivery delivery) {
        if (delivery.getStatus() == null || delivery.getStatus().trim().isEmpty()) {
            delivery.setStatus(DeliveryStatus.PENDING.name());
        }
        if (delivery.getDeliveryOtp() == null || delivery.getDeliveryOtp().trim().isEmpty()) {
            delivery.setDeliveryOtp(generateDeliveryOtp());
        }
        if (delivery.getCreatedAt() == null) {
            delivery.setCreatedAt(LocalDateTime.now());
        }
        delivery.setUpdatedAt(LocalDateTime.now());
        return deliveryRepository.save(delivery);
    }

    /**
     * Retrieve all deliveries with optional status filter for management view
     */
    @Transactional(readOnly = true)
    public List<Delivery> getAllDeliveries(String statusFilter) {
        if (statusFilter != null && !statusFilter.trim().isEmpty() && !statusFilter.equalsIgnoreCase("ALL")) {
            return deliveryRepository.findByStatus(statusFilter.trim().toUpperCase());
        }
        return deliveryRepository.findAllByOrderByIdDesc();
    }

    /**
     * Legacy getter
     */
    @Transactional(readOnly = true)
    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAllByOrderByIdDesc();
    }

    @Transactional(readOnly = true)
    public Delivery getDeliveryById(Long id) {
        return deliveryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found with id: " + id));
    }

    /**
     * Assign a Delivery Route and Delivery Courier to a single delivery or a batch of deliveries.
     * Automatically transitions status from PENDING to DISPATCHED.
     */
    public List<Delivery> assignDeliveries(AssignDeliveryRequest request) {
        List<Long> ids = request.resolveDeliveryIds();
        if (ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one deliveryId must be provided for assignment");
        }

        String assignedBatchId = request.getBatchId();
        if ((assignedBatchId == null || assignedBatchId.trim().isEmpty()) && ids.size() > 1) {
            assignedBatchId = "BATCH-" + System.currentTimeMillis();
        }

        List<Delivery> updatedList = new ArrayList<>();
        for (Long id : ids) {
            Delivery delivery = deliveryRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found with id: " + id));

            if (request.getRoute() != null && !request.getRoute().trim().isEmpty()) {
                delivery.setAssignedRoute(request.getRoute().trim());
            }
            if (request.getCourier() != null && !request.getCourier().trim().isEmpty()) {
                delivery.setAssignedCourier(request.getCourier().trim());
            }
            if (assignedBatchId != null && !assignedBatchId.trim().isEmpty()) {
                delivery.setBatchId(assignedBatchId.trim());
            }

            // Automatic state transition: PENDING -> DISPATCHED
            delivery.setStatus(DeliveryStatus.DISPATCHED.name());
            delivery.setUpdatedAt(LocalDateTime.now());
            updatedList.add(deliveryRepository.save(delivery));
        }

        return updatedList;
    }

    /**
     * Perform specific lifecycle actions on a delivery: TERMINATE, HOLD, POSTPONE
     */
    public Delivery performAction(Long id, DeliveryActionRequest request) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found with id: " + id));

        if (request.getAction() == null || request.getAction().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Action must be provided (TERMINATE, HOLD, POSTPONE)");
        }

        String action = request.getAction().trim().toUpperCase();
        switch (action) {
            case "TERMINATE":
                delivery.setStatus(DeliveryStatus.TERMINATED.name());
                delivery.setActionStatus("TERMINATED");
                break;
            case "HOLD":
                delivery.setStatus(DeliveryStatus.ON_HOLD.name());
                delivery.setActionStatus("ON_HOLD");
                break;
            case "POSTPONE":
                delivery.setStatus(DeliveryStatus.POSTPONED.name());
                delivery.setActionStatus("POSTPONED");
                break;
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported action: " + action + ". Supported actions: TERMINATE, HOLD, POSTPONE");
        }

        if (request.getReason() != null) {
            delivery.setActionReason(request.getReason().trim());
        }
        delivery.setUpdatedAt(LocalDateTime.now());
        return deliveryRepository.save(delivery);
    }

    /**
     * Courier API: List deliveries tailored strictly for couriers.
     * Only returns deliveryId/batchId, customerName, orderAddress, customerPhone.
     */
    @Transactional(readOnly = true)
    public List<CourierDeliveryResponse> getCourierDeliveries(String courier) {
        List<Delivery> list;
        if (courier != null && !courier.trim().isEmpty() && !courier.equalsIgnoreCase("ALL")) {
            list = deliveryRepository.findByAssignedCourier(courier.trim());
        } else {
            list = deliveryRepository.findAllByOrderByIdDesc();
        }

        // Return only active courier visible orders (dispatched, in transit, delivered, failed)
        return list.stream()
                .filter(d -> !DeliveryStatus.TERMINATED.name().equalsIgnoreCase(d.getStatus()))
                .map(d -> CourierDeliveryResponse.builder()
                        .deliveryId(d.getId())
                        .batchId(d.getBatchId())
                        .customerName(d.getCustomerName())
                        .orderAddress(d.getOrderAddress() != null ? d.getOrderAddress() : d.getDeliveryAddress())
                        .customerPhone(d.getCustomerPhone())
                        .status(d.getStatus())
                        .assignedCourier(d.getAssignedCourier())
                        .assignedRoute(d.getAssignedRoute())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Courier API: Update delivery status.
     * - Allows direct updates to IN_TRANSIT and FAILED.
     * - Strictly requires a valid OTP in the payload for DELIVERED.
     */
    public CourierDeliveryResponse updateCourierStatus(Long id, CourierStatusUpdateRequest request) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found with id: " + id));

        if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required (IN_TRANSIT, FAILED, DELIVERED)");
        }

        String targetStatus = request.getStatus().trim().toUpperCase();

        if (DeliveryStatus.DELIVERED.name().equals(targetStatus)) {
            // Strictly require and verify OTP
            if (request.getOtp() == null || request.getOtp().trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer OTP is required to mark delivery as DELIVERED");
            }
            String enteredOtp = request.getOtp().trim();
            if (delivery.getDeliveryOtp() == null || !delivery.getDeliveryOtp().trim().equals(enteredOtp)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP. Customer verification failed.");
            }
            delivery.setStatus(DeliveryStatus.DELIVERED.name());
            delivery.setDeliveredAt(LocalDateTime.now());
        } else if (DeliveryStatus.IN_TRANSIT.name().equals(targetStatus)) {
            delivery.setStatus(DeliveryStatus.IN_TRANSIT.name());
        } else if (DeliveryStatus.FAILED.name().equals(targetStatus)) {
            delivery.setStatus(DeliveryStatus.FAILED.name());
            if (request.getFailureReason() != null) {
                delivery.setActionReason(request.getFailureReason());
            }
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status for courier update: " + targetStatus + ". Allowed: IN_TRANSIT, FAILED, DELIVERED");
        }

        delivery.setUpdatedAt(LocalDateTime.now());
        Delivery saved = deliveryRepository.save(delivery);

        return CourierDeliveryResponse.builder()
                .deliveryId(saved.getId())
                .batchId(saved.getBatchId())
                .customerName(saved.getCustomerName())
                .orderAddress(saved.getOrderAddress())
                .customerPhone(saved.getCustomerPhone())
                .status(saved.getStatus())
                .assignedCourier(saved.getAssignedCourier())
                .assignedRoute(saved.getAssignedRoute())
                .build();
    }

    /**
     * Direct status update helper for backward compatibility
     */
    public Delivery updateDeliveryStatus(Long id, String status) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found with id: " + id));
        if (status != null && !status.trim().isEmpty()) {
            delivery.setStatus(status.trim().toUpperCase());
        }
        delivery.setUpdatedAt(LocalDateTime.now());
        return deliveryRepository.save(delivery);
    }

    public void deleteDelivery(Long id) {
        if (!deliveryRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found with id: " + id);
        }
        deliveryRepository.deleteById(id);
    }
}
