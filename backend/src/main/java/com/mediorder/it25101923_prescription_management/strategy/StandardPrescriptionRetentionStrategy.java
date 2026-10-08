package com.mediorder.it25101923_prescription_management.strategy;

import com.mediorder.it25101923_prescription_management.dto.PrescriptionVerificationRequest;
import com.mediorder.it25101923_prescription_management.model.Prescription;
import org.springframework.stereotype.Component;

/**
 * Retention strategy for standard (non-chronic) prescriptions.
 * Rejected files may be deleted immediately when requested or when the
 * configured automatic deletion policy is enabled.
 */
@Component
public class StandardPrescriptionRetentionStrategy implements PrescriptionRetentionStrategy {

    @Override
    public boolean supports(Prescription prescription) {
        return prescription != null && !Boolean.TRUE.equals(prescription.getChronicSubscription());
    }

    @Override
    public boolean shouldDeleteRejectedFile(
            PrescriptionVerificationRequest request,
            boolean autoDeleteRejectedFiles
    ) {
        return Boolean.TRUE.equals(request.getDeleteFileImmediately()) || autoDeleteRejectedFiles;
    }
}
