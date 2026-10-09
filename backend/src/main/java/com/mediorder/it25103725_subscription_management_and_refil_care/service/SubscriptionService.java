package com.mediorder.it25103725_subscription_management_and_refil_care.service;

import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionItem;

import com.mediorder.it25103725_subscription_management_and_refil_care.dto.SubscriptionView;

import com.mediorder.it25103725_subscription_management_and_refil_care.dto.CustomerSubscriptionRequest;

import com.mediorder.it25103725_subscription_management_and_refil_care.dto.SubscriptionRequest;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.Subscription;
import com.mediorder.it25103725_subscription_management_and_refil_care.model.SubscriptionStatus;
import com.mediorder.it25103725_subscription_management_and_refil_care.repository.SubscriptionRepository;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SubscriptionService {

    /** System Admin kill switch; optional so unit tests without it still work. */
    @Autowired(required = false)
    private com.mediorder.system_build_functions.service.FeatureFlagService featureFlagService;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.mediorder.it25103725_subscription_management_and_refil_care.repository.SubscriptionItemRepository subscriptionItemRepository;

    @Autowired
    private com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository medicineRepository;

    @Autowired(required = false)
    private com.mediorder.it25101923_prescription_management.repository.PrescriptionRepository prescriptionRepository;

    @Transactional(readOnly = true)
    public List<Subscription> getAllSubscriptions() {
        return subscriptionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Subscription> getSubscriptionsByCustomer(Long customerId) {
        return subscriptionRepository.findByCustomerId(customerId);
    }

    @Transactional(readOnly = true)
    public Optional<Subscription> getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id);
    }

    private void assertRefillsEnabled() {
        if (featureFlagService != null) {
            featureFlagService.assertFeatureEnabled(
                    com.mediorder.system_build_functions.service.FeatureKeys.REFILLS, "Refill subscriptions");
        }
    }

    public Subscription createSubscription(SubscriptionRequest request) {
        assertRefillsEnabled();
        Optional<User> userOpt = userRepository.findById(request.getCustomerId());
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Customer not found with id: " + request.getCustomerId());
        }

        LocalDate nextDate = request.getNextRefillDate() != null
                ? request.getNextRefillDate()
                : LocalDate.now().plusDays(request.getFrequencyDays() != null ? request.getFrequencyDays() : 30);

        Subscription subscription = Subscription.builder()
                .customer(userOpt.get())
                .frequencyDays(request.getFrequencyDays() != null ? request.getFrequencyDays() : 30)
                .nextRefillDate(nextDate)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        Subscription saved = subscriptionRepository.save(subscription);
        saveItems(saved, request.getItems());
        return saved;
    }

    // ------------------------------------------------------------------
    // Customer self-service ("my subscriptions")
    // ------------------------------------------------------------------

    /** A customer subscribes to regular refills of one or more medicines. */
    public SubscriptionView createForCustomer(User customer, CustomerSubscriptionRequest request) {
        assertRefillsEnabled();
        List<com.mediorder.it25102867_batchandstock_management.model.Medicine> medicines = request.getItems().stream()
                .map(item -> medicineRepository.findById(item.getMedicineId())
                        .orElseThrow(() -> new IllegalArgumentException("Medicine not found with id: " + item.getMedicineId())))
                .toList();

        // Prescription Management integration: prescription-only refills need an approved prescription.
        List<String> rxNames = medicines.stream()
                .filter(m -> Boolean.TRUE.equals(m.getRequiresPrescription()))
                .map(com.mediorder.it25102867_batchandstock_management.model.Medicine::getName)
                .toList();
        if (!rxNames.isEmpty()) {
            requireApprovedPrescription(customer, request.getPrescriptionId(), String.join(", ", rxNames));
        }

        Subscription subscription = subscriptionRepository.save(Subscription.builder()
                .customer(customer)
                .frequencyDays(request.getFrequencyDays())
                .nextRefillDate(request.getNextRefillDate() != null
                        ? request.getNextRefillDate()
                        : LocalDate.now().plusDays(request.getFrequencyDays()))
                .status(SubscriptionStatus.ACTIVE)
                .createdAt(java.time.LocalDateTime.now())
                .build());
        subscription.setDeliveryAddress(request.getDeliveryAddress().trim());
        subscription.setContactPhone(request.getContactPhone().trim());
        subscription.setPreferredCourier(request.getPreferredCourier() != null && !request.getPreferredCourier().isBlank()
                ? request.getPreferredCourier().trim() : null);
        subscription = subscriptionRepository.save(subscription);
        saveItems(subscription, request.getItems());
        return toView(subscription);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionView> getViewsForCustomer(Long customerId) {
        return subscriptionRepository.findByCustomerId(customerId).stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionView> getAllViews() {
        return subscriptionRepository.findAll().stream().map(this::toView).toList();
    }

    /** Pause, resume or cancel one of the customer's own subscriptions. Cancelled is final. */
    public SubscriptionView changeOwnStatus(User customer, Long id, SubscriptionStatus status) {
        Subscription sub = subscriptionRepository.findById(id)
                .filter(s -> s.getCustomer() != null && customer.getId().equals(s.getCustomer().getId()))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Subscription not found: " + id));
        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT, "Subscription #" + id + " is cancelled and cannot be changed.");
        }
        if (status == SubscriptionStatus.ACTIVE) {
            assertRefillsEnabled();
        }
        sub.setStatus(status);
        return toView(subscriptionRepository.save(sub));
    }

    private void requireApprovedPrescription(User customer, Long prescriptionId, String items) {
        if (prescriptionRepository == null) {
            return;
        }
        if (prescriptionId == null) {
            throw new IllegalArgumentException(items + " require(s) an approved prescription for refills. "
                    + "Upload your prescription and choose it when subscribing.");
        }
        var prescription = prescriptionRepository.findById(prescriptionId)
                .filter(p -> p.getCustomer() != null && customer.getId().equals(p.getCustomer().getId()))
                .orElseThrow(() -> new IllegalArgumentException("Prescription #" + prescriptionId + " was not found in your account."));
        if (prescription.getStatus() != com.mediorder.it25101923_prescription_management.model.PrescriptionStatus.APPROVED) {
            throw new IllegalArgumentException("Prescription #" + prescriptionId + " is " + prescription.getStatus()
                    + ". Only a pharmacist-approved prescription can be used.");
        }
    }

    private void saveItems(Subscription subscription, List<SubscriptionRequest.SubscriptionItemDto> items) {
        if (items == null) {
            return;
        }
        for (SubscriptionRequest.SubscriptionItemDto dto : items) {
            var medicine = medicineRepository.findById(dto.getMedicineId())
                    .orElseThrow(() -> new IllegalArgumentException("Medicine not found with id: " + dto.getMedicineId()));
            SubscriptionItem item = new SubscriptionItem();
            item.setSubscription(subscription);
            item.setMedicine(medicine);
            item.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 1);
            subscriptionItemRepository.save(item);
        }
    }

    private SubscriptionView toView(Subscription sub) {
        List<SubscriptionView.Item> items = subscriptionItemRepository.findBySubscriptionId(sub.getId()).stream()
                .map(i -> new SubscriptionView.Item(
                        i.getMedicine() != null ? i.getMedicine().getId() : null,
                        i.getMedicine() != null ? i.getMedicine().getName() : "Unknown medicine",
                        i.getQuantity(),
                        i.getMedicine() != null ? i.getMedicine().getUnitPrice() : null,
                        i.getMedicine() != null && Boolean.TRUE.equals(i.getMedicine().getRequiresPrescription())))
                .toList();
        return new SubscriptionView(
                sub.getId(),
                sub.getCustomer() != null ? sub.getCustomer().getId() : null,
                sub.getCustomer() != null ? sub.getCustomer().getFullName() : null,
                sub.getFrequencyDays(),
                sub.getNextRefillDate(),
                sub.getStatus() != null ? sub.getStatus().name() : null,
                sub.getCreatedAt(),
                sub.getDeliveryAddress(),
                sub.getContactPhone(),
                sub.getPreferredCourier(),
                items);
    }

    public Optional<Subscription> updateStatus(Long id, SubscriptionStatus status) {
        return subscriptionRepository.findById(id).map(sub -> {
            sub.setStatus(status);
            return subscriptionRepository.save(sub);
        });
    }

    public Optional<Subscription> advanceRefillCycle(Long id) {
        assertRefillsEnabled();
        return subscriptionRepository.findById(id).map(sub -> {
            sub.setNextRefillDate(sub.getNextRefillDate().plusDays(sub.getFrequencyDays()));
            return subscriptionRepository.save(sub);
        });
    }
}
