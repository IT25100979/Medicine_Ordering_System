package com.mediorder.it25101923_prescription_management.dto;

import com.mediorder.it25101923_prescription_management.model.PrescriptionStatus;

public class PrescriptionVerificationRequest {
    private PrescriptionStatus status;
    private String verificationNotes;
    private String rejectionReason;
    private Boolean deleteFileImmediately;

    public PrescriptionVerificationRequest() {}

    public PrescriptionVerificationRequest(PrescriptionStatus status, String verificationNotes, String rejectionReason, Boolean deleteFileImmediately) {
        this.status = status;
        this.verificationNotes = verificationNotes;
        this.rejectionReason = rejectionReason;
        this.deleteFileImmediately = deleteFileImmediately;
    }

    public PrescriptionStatus getStatus() { return status; }
    public void setStatus(PrescriptionStatus status) { this.status = status; }

    public String getVerificationNotes() { return verificationNotes; }
    public void setVerificationNotes(String verificationNotes) { this.verificationNotes = verificationNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Boolean getDeleteFileImmediately() { return deleteFileImmediately; }
    public void setDeleteFileImmediately(Boolean deleteFileImmediately) { this.deleteFileImmediately = deleteFileImmediately; }

    public static PrescriptionVerificationRequestBuilder builder() {
        return new PrescriptionVerificationRequestBuilder();
    }

    public static class PrescriptionVerificationRequestBuilder {
        private PrescriptionStatus status;
        private String verificationNotes;
        private String rejectionReason;
        private Boolean deleteFileImmediately;

        public PrescriptionVerificationRequestBuilder status(PrescriptionStatus status) {
            this.status = status;
            return this;
        }

        public PrescriptionVerificationRequestBuilder verificationNotes(String verificationNotes) {
            this.verificationNotes = verificationNotes;
            return this;
        }

        public PrescriptionVerificationRequestBuilder rejectionReason(String rejectionReason) {
            this.rejectionReason = rejectionReason;
            return this;
        }

        public PrescriptionVerificationRequestBuilder deleteFileImmediately(Boolean deleteFileImmediately) {
            this.deleteFileImmediately = deleteFileImmediately;
            return this;
        }

        public PrescriptionVerificationRequest build() {
            return new PrescriptionVerificationRequest(status, verificationNotes, rejectionReason, deleteFileImmediately);
        }
    }
}


