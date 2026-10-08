package com.mediorder.it25101923_prescription_management.strategy;

import com.mediorder.it25101923_prescription_management.dto.PrescriptionVerificationRequest;
import com.mediorder.it25101923_prescription_management.model.Prescription;
import org.springframework.stereotype.Component;

/**
 * Retention strategy for chronic prescriptions.
 * Chronic prescription documents are preserved until explicitly deleted.
 */
@Component
public class ChronicPrescriptionRetentionStrategy implements PrescriptionRetentionStrategy {

    @Override
    public boolean supports(Prescription prescription) {
        return prescription != null && Boolean.TRUE.equals(prescription.getChronicSubscription());
    }

    @Override
    public boolean shouldDeleteRejectedFile(
            PrescriptionVerificationRequest request,
            boolean autoDeleteRejectedFiles
    ) {
        return false;
    }
}
