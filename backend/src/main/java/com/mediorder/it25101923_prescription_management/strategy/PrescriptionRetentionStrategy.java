package com.mediorder.it25101923_prescription_management.strategy;

import com.mediorder.it25101923_prescription_management.dto.PrescriptionVerificationRequest;
import com.mediorder.it25101923_prescription_management.model.Prescription;

/**
 * Strategy abstraction for deciding how a prescription file should be retained
 * after verification/rejection.
 */
public interface PrescriptionRetentionStrategy {

    boolean supports(Prescription prescription);

    boolean shouldDeleteRejectedFile(
            PrescriptionVerificationRequest request,
            boolean autoDeleteRejectedFiles
    );
}
