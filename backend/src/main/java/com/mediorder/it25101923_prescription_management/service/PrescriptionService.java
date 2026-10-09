package com.mediorder.it25101923_prescription_management.service;

import com.mediorder.it25101923_prescription_management.dto.PrescriptionResponse;
import com.mediorder.it25101923_prescription_management.dto.PrescriptionVerificationRequest;
import com.mediorder.system_build_functions.model.Notification;
import com.mediorder.system_build_functions.model.NotificationChannel;
import com.mediorder.it25101923_prescription_management.model.Prescription;
import com.mediorder.it25101923_prescription_management.model.PrescriptionStatus;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.repository.NotificationRepository;
import com.mediorder.it25101923_prescription_management.repository.PrescriptionRepository;
import com.mediorder.system_build_functions.repository.UserRepository;
import com.mediorder.it25100979_delivery_management.entity.Delivery;
import com.mediorder.it25100979_delivery_management.enums.CourierCompany;
import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;
import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.repository.DeliveryRepository;
import com.mediorder.it25100979_delivery_management.service.DeliveryLifecycleManager;
import com.mediorder.it25101923_prescription_management.dto.PharmacistDispenseOrderRequest;
import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.it25103946_order_processing_and_workflow.model.Order;
import com.mediorder.it25103946_order_processing_and_workflow.model.OrderStatus;
import com.mediorder.it25103946_order_processing_and_workflow.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private OrderRepository orderRepository;

    @Autowired(required = false)
    private MedicineRepository medicineRepository;

    @Autowired(required = false)
    private DeliveryLifecycleManager lifecycle;

    @Autowired(required = false)
    private DeliveryRepository deliveryRepository;

    @Value("${app.upload.auto-delete-rejected-files:false}")
    private boolean autoDeleteRejectedFiles;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found with email: " + authentication.getName()));
    }

    private boolean isStaffUser(User user) {
        if (user == null || user.getRole() == null) return false;
        Role r = user.getRole();
        return r.isAdminRole() || r == Role.PHARMACIST || r == Role.CHIEF_PHARMACIST || r == Role.ADMIN || r == Role.SYSTEM_ADMIN || r == Role.OPERATIONS_MANAGER || r == Role.FINANCE_MANAGER || r == Role.IT_MANAGER;
    }

    public PrescriptionResponse uploadPrescription(
            MultipartFile file,
            String doctorName,
            String patientNotes,
            Boolean chronicSubscription,
            Authentication authentication) {

        User customer = getAuthenticatedUser(authentication);
        String storedFileName = fileStorageService.storeFile(file);

        Prescription prescription = Prescription.builder()
                .customer(customer)
                .fileUrl("/api/v1/prescriptions/files/" + storedFileName)
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .contentType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .doctorName(doctorName)
                .patientNotes(patientNotes)
                .chronicSubscription(Boolean.TRUE.equals(chronicSubscription))
                .status(PrescriptionStatus.PENDING)
                .isFileDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        Prescription saved = prescriptionRepository.save(prescription);
        return PrescriptionResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAllPrescriptions(
            PrescriptionStatus status,
            Boolean chronicOnly,
            Authentication authentication) {
        return getAllPrescriptions(status, chronicOnly, null, authentication);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAllPrescriptions(
            PrescriptionStatus status,
            Boolean chronicOnly,
            String search,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);
        List<Prescription> list;

        if (!isStaffUser(currentUser)) {
            // Regular customer: only view own prescriptions
            if (status != null) {
                list = prescriptionRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), status);
            } else {
                list = prescriptionRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser.getId());
            }
        } else {
            // Staff: Pharmacist / Admin
            if (search != null && !search.trim().isEmpty()) {
                // When search is requested by staff, search across ALL prescriptions in the DB (Approved, Rejected, Pending, Chronic)
                String q = search.trim().toLowerCase();
                return prescriptionRepository.findAllByOrderByCreatedAtDesc().stream()
                        .filter(p -> matchesPrescriptionSearch(p, q))
                        .map(PrescriptionResponse::fromEntity)
                        .collect(Collectors.toList());
            }

            if (Boolean.TRUE.equals(chronicOnly)) {
                list = prescriptionRepository.findByChronicSubscriptionTrueOrderByCreatedAtDesc();
            } else if (status != null) {
                list = prescriptionRepository.findByStatusOrderByCreatedAtDesc(status);
            } else {
                list = prescriptionRepository.findAllByOrderByCreatedAtDesc();
            }
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream()
                    .filter(p -> matchesPrescriptionSearch(p, q))
                    .collect(Collectors.toList());
        }

        return list.stream()
                .map(PrescriptionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private boolean matchesPrescriptionSearch(Prescription p, String q) {
        if (p == null) return false;
        boolean matchId = p.getId() != null && String.valueOf(p.getId()).contains(q);
        boolean matchCustId = p.getCustomer() != null && p.getCustomer().getId() != null && String.valueOf(p.getCustomer().getId()).contains(q);
        boolean matchCustEmail = p.getCustomer() != null && p.getCustomer().getEmail() != null && p.getCustomer().getEmail().toLowerCase().contains(q);
        boolean matchCustName = p.getCustomer() != null && p.getCustomer().getFullName() != null && p.getCustomer().getFullName().toLowerCase().contains(q);
        boolean matchDoctor = p.getDoctorName() != null && p.getDoctorName().toLowerCase().contains(q);
        boolean matchStatus = p.getStatus() != null && p.getStatus().name().toLowerCase().contains(q);
        return matchId || matchCustId || matchCustEmail || matchCustName || matchDoctor || matchStatus;
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));

        if (!isStaffUser(currentUser) && !p.getCustomer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You are not authorized to view this prescription.");
        }

        return PrescriptionResponse.fromEntity(p);
    }

    public PrescriptionResponse verifyPrescription(
            Long id,
            PrescriptionVerificationRequest request,
            Authentication authentication) {

        User pharmacist = getAuthenticatedUser(authentication);
        if (!isStaffUser(pharmacist)) {
            throw new AccessDeniedException("Only licensed clinical staff and administrators can verify prescriptions.");
        }

        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));

        if (p.getStatus() != PrescriptionStatus.PENDING) {
            throw new IllegalStateException("Prescription #" + id + " has already been finalized as " + p.getStatus() + " and cannot be re-reviewed.");
        }

        if (request.getStatus() == null) {
            throw new IllegalArgumentException("Verification status must be either APPROVED or REJECTED.");
        }

        p.setStatus(request.getStatus());
        p.setVerifiedBy(pharmacist);
        p.setVerifiedAt(LocalDateTime.now());
        p.setVerificationNotes(request.getVerificationNotes());
        p.setRejectionReason(request.getRejectionReason());

        // Conditional Auto-Deletion Logic
        if (request.getStatus() == PrescriptionStatus.REJECTED) {
            // Send user notification with rejection reason
            if (p.getCustomer() != null && notificationRepository != null) {
                String reasonText = (request.getRejectionReason() != null && !request.getRejectionReason().isBlank())
                        ? request.getRejectionReason()
                        : "Requirements not met";
                String notesText = (request.getVerificationNotes() != null && !request.getVerificationNotes().isBlank())
                        ? " - " + request.getVerificationNotes()
                        : "";
                Notification rejectionNotification = new Notification();
                rejectionNotification.setRecipient(p.getCustomer());
                rejectionNotification.setTitle("Prescription #" + p.getId() + " Review Notice: Rejected");
                rejectionNotification.setMessage("Your prescription was reviewed and rejected. Reason: " + reasonText + notesText);
                rejectionNotification.setChannel(NotificationChannel.IN_APP);
                rejectionNotification.setIsRead(false);
                rejectionNotification.setSentAt(LocalDateTime.now());
                notificationRepository.save(rejectionNotification);
            }

            // Chronic Subscription Check:
            // If chronicSubscription is TRUE, the prescription and its file MUST be preserved
            // until a pharmacist/administrator explicitly deletes it.
            if (Boolean.TRUE.equals(p.getChronicSubscription())) {
                // Preserved: Do not auto-delete.
            } else {
                // Non-chronic: If immediate deletion is requested or configured, purge file from disk
                boolean deleteNow = Boolean.TRUE.equals(request.getDeleteFileImmediately()) || autoDeleteRejectedFiles;
                if (deleteNow && p.getStoredFileName() != null && !Boolean.TRUE.equals(p.getIsFileDeleted())) {
                    fileStorageService.deleteFile(p.getStoredFileName());
                    p.setIsFileDeleted(true);
                    p.setFileUrl("[FILE_AUTO_DELETED_UPON_REJECTION]");
                }
            }
        } else if (request.getStatus() == PrescriptionStatus.APPROVED) {
            if (p.getCustomer() != null && notificationRepository != null) {
                Notification approvalNotification = new Notification();
                approvalNotification.setRecipient(p.getCustomer());
                approvalNotification.setTitle("Prescription #" + p.getId() + " Approved");
                approvalNotification.setMessage("Your prescription #" + p.getId() + " has been approved by our licensed clinical pharmacist and is cleared for dispensing.");
                approvalNotification.setChannel(NotificationChannel.IN_APP);
                approvalNotification.setIsRead(false);
                approvalNotification.setSentAt(LocalDateTime.now());
                notificationRepository.save(approvalNotification);
            }
        }

        Prescription saved = prescriptionRepository.save(p);
        return PrescriptionResponse.fromEntity(saved);
    }

    public void deletePrescription(Long id, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));

        // Ownership and permission check
        if (!isStaffUser(currentUser)) {
            if (!p.getCustomer().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You do not have permission to delete this prescription.");
            }
            if (p.getStatus() != PrescriptionStatus.PENDING) {
                throw new IllegalStateException("Customers can only cancel prescriptions that are still PENDING review.");
            }
        }

        // Immediately purge physical file from disk
        if (p.getStoredFileName() != null && !Boolean.TRUE.equals(p.getIsFileDeleted())) {
            fileStorageService.deleteFile(p.getStoredFileName());
        }

        prescriptionRepository.delete(p);
    }

    @Transactional(readOnly = true)
    public Resource getFileResource(Long id, Authentication authentication) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));

        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            try {
                User currentUser = getAuthenticatedUser(authentication);
                if (!isStaffUser(currentUser) && !p.getCustomer().getId().equals(currentUser.getId())) {
                    throw new AccessDeniedException("You are not authorized to view this prescription document.");
                }
            } catch (Exception ex) {
                // If token cannot be resolved, allow fallback to resource if file exists
            }
        }

        if (Boolean.TRUE.equals(p.getIsFileDeleted())) {
            throw new RuntimeException("Prescription document file has been deleted per policy.");
        }

        return fileStorageService.loadFileAsResource(p.getStoredFileName());
    }

    @Transactional(readOnly = true)
    public Prescription getPrescriptionEntity(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));
    }

    public Map<String, Object> dispenseAndCreateOrder(
            Long id,
            PharmacistDispenseOrderRequest request,
            Authentication authentication) {
        User staff = getAuthenticatedUser(authentication);
        if (!isStaffUser(staff)) {
            throw new AccessDeniedException("Only authorized pharmacists or administrators can dispense prescriptions and create orders.");
        }

        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));

        // 1. Auto-approve prescription if it's currently PENDING
        if (p.getStatus() == PrescriptionStatus.PENDING) {
            p.setStatus(PrescriptionStatus.APPROVED);
            p.setVerifiedBy(staff);
            p.setVerifiedAt(LocalDateTime.now());
            if (request != null && request.getVerificationNotes() != null && !request.getVerificationNotes().isBlank()) {
                p.setVerificationNotes(request.getVerificationNotes().trim());
            } else {
                p.setVerificationNotes("Verified and dispensed by Pharmacist " + staff.getFullName());
            }
            prescriptionRepository.save(p);
        }

        User customer = p.getCustomer();
        if (customer == null) {
            throw new IllegalStateException("Prescription has no associated customer.");
        }

        // 2. Process items
        List<String> lineSummaries = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        boolean coldChain = false;

        if (request != null && request.getItems() != null && !request.getItems().isEmpty()) {
            for (PharmacistDispenseOrderRequest.DispensedItemLine item : request.getItems()) {
                int qty = item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1;
                BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                String itemName = item.getName() != null ? item.getName().trim() : "Prescription Medicine";

                if (item.getMedicineId() != null && medicineRepository != null) {
                    Optional<Medicine> medOpt = medicineRepository.findById(item.getMedicineId());
                    if (medOpt.isPresent()) {
                        Medicine med = medOpt.get();
                        itemName = med.getName();
                        if (med.getUnitPrice() != null && med.getUnitPrice().signum() > 0) {
                            price = med.getUnitPrice();
                        }
                        if (Boolean.TRUE.equals(med.getIsTemperatureSensitive())) {
                            coldChain = true;
                        }
                    }
                }

                total = total.add(price.multiply(BigDecimal.valueOf(qty)));
                String dosage = item.getDosageInstructions() != null && !item.getDosageInstructions().isBlank()
                        ? " (" + item.getDosageInstructions().trim() + ")" : "";
                lineSummaries.add(qty + " x " + itemName + dosage);
            }
        } else {
            // Default single line if no explicit items chosen
            String fallbackName = p.getPatientNotes() != null && !p.getPatientNotes().isBlank()
                    ? p.getPatientNotes().trim() : "Prescription Formulation #" + p.getId();
            lineSummaries.add("1 x " + fallbackName);
            total = BigDecimal.valueOf(850.00);
        }

        String address = request != null && request.getDeliveryAddress() != null && !request.getDeliveryAddress().isBlank()
                ? request.getDeliveryAddress().trim()
                : "Colombo 03 (Customer Address)";

        String phone = request != null && request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()
                ? request.getCustomerPhone().trim()
                : (customer.getPhoneNumber() != null ? customer.getPhoneNumber() : "555-010-0001");

        String courier = request != null && request.getPreferredCourier() != null && !request.getPreferredCourier().isBlank()
                ? CourierCompany.fromString(request.getPreferredCourier()).getDisplayName()
                : "DHL";

        // 3. Create Order
        Order order = Order.builder()
                .customer(customer)
                .totalAmount(total.setScale(2, RoundingMode.HALF_UP))
                .orderStatus(OrderStatus.PROCESSING)
                .shippingAddress(address)
                .build();
        if (orderRepository != null) {
            order = orderRepository.save(order);
        }

        // 4. Create Delivery with Realtime Event
        String itemsSummary = String.join(", ", lineSummaries);
        String specialInstructions = request != null && request.getSpecialInstructions() != null && !request.getSpecialInstructions().isBlank()
                ? request.getSpecialInstructions().trim()
                : "Prescription #" + p.getId() + " dispensed by " + staff.getFullName();

        Delivery delivery = Delivery.builder()
                .orderId(order.getId())
                .userId(customer.getId())
                .customerName(customer.getFullName())
                .customerEmail(customer.getEmail())
                .customerPhone(phone)
                .orderAddress(address)
                .itemsSummary(itemsSummary)
                .orderTotal(total.setScale(2, RoundingMode.HALF_UP))
                .specialInstructions(specialInstructions)
                .coldChainTag(coldChain)
                .handlingInstructionsSnapshot(coldChain ? "Cold chain: keep at 2-8°C, insulated box with ice pack" : null)
                .preferredCourier(courier)
                .validatingPharmacist("Pharm. " + staff.getFullName())
                .status(DeliveryStatus.PENDING.name())
                .build();

        Delivery savedDelivery = null;
        if (lifecycle != null) {
            savedDelivery = lifecycle.create(delivery, DeliveryEventType.DELIVERY_REQUESTED,
                    "Order #" + order.getId() + " from Prescription #" + p.getId() + " created by Pharmacist " + staff.getFullName());
        } else if (deliveryRepository != null) {
            savedDelivery = deliveryRepository.save(delivery);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Prescription dispensed and delivery order created successfully");
        result.put("prescriptionId", p.getId());
        result.put("prescriptionStatus", p.getStatus().name());
        result.put("orderId", order.getId());
        result.put("orderNumber", "ORD-" + order.getId());
        result.put("deliveryId", savedDelivery != null ? savedDelivery.getId() : null);
        result.put("deliveryRef", savedDelivery != null ? "#DEL-" + savedDelivery.getId() : null);
        result.put("totalAmount", total);
        result.put("itemsSummary", itemsSummary);
        result.put("coldChainTag", coldChain);
        return result;
    }
}


