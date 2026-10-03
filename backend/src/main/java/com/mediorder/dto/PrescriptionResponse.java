package com.mediorder.dto;

import com.mediorder.model.Prescription;
import com.mediorder.model.PrescriptionStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String fileUrl;
    private String originalFileName;
    private String storedFileName;
    private String contentType;
    private Long fileSizeBytes;
    private String doctorName;
    private String patientNotes;
    private Boolean chronicSubscription;
    private PrescriptionStatus status;
    private Long verifiedById;
    private String verifiedByName;
    private LocalDateTime verifiedAt;
    private String verificationNotes;
    private String rejectionReason;
    private Boolean isFileDeleted;
    private LocalDateTime createdAt;

    public static PrescriptionResponse fromEntity(Prescription p) {
        if (p == null) return null;
        PrescriptionResponse response = new PrescriptionResponse();
        response.setId(p.getId());
        if (p.getCustomer() != null) {
            response.setCustomerId(p.getCustomer().getId());
            response.setCustomerName(p.getCustomer().getFullName());
            response.setCustomerEmail(p.getCustomer().getEmail());
        }
        response.setFileUrl(p.getFileUrl());
        response.setOriginalFileName(p.getOriginalFileName());
        response.setStoredFileName(p.getStoredFileName());
        response.setContentType(p.getContentType());
        response.setFileSizeBytes(p.getFileSizeBytes());
        response.setDoctorName(p.getDoctorName());
        response.setPatientNotes(p.getPatientNotes());
        response.setChronicSubscription(Boolean.TRUE.equals(p.getChronicSubscription()));
        response.setStatus(p.getStatus());
        if (p.getVerifiedBy() != null) {
            response.setVerifiedById(p.getVerifiedBy().getId());
            response.setVerifiedByName(p.getVerifiedBy().getFullName());
        }
        response.setVerifiedAt(p.getVerifiedAt());
        response.setVerificationNotes(p.getVerificationNotes());
        response.setRejectionReason(p.getRejectionReason());
        response.setIsFileDeleted(Boolean.TRUE.equals(p.getIsFileDeleted()));
        response.setCreatedAt(p.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    public String getStoredFileName() { return storedFileName; }
    public void setStoredFileName(String storedFileName) { this.storedFileName = storedFileName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public String getPatientNotes() { return patientNotes; }
    public void setPatientNotes(String patientNotes) { this.patientNotes = patientNotes; }
    public Boolean getChronicSubscription() { return chronicSubscription; }
    public void setChronicSubscription(Boolean chronicSubscription) { this.chronicSubscription = chronicSubscription; }
    public PrescriptionStatus getStatus() { return status; }
    public void setStatus(PrescriptionStatus status) { this.status = status; }
    public Long getVerifiedById() { return verifiedById; }
    public void setVerifiedById(Long verifiedById) { this.verifiedById = verifiedById; }
    public String getVerifiedByName() { return verifiedByName; }
    public void setVerifiedByName(String verifiedByName) { this.verifiedByName = verifiedByName; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
    public String getVerificationNotes() { return verificationNotes; }
    public void setVerificationNotes(String verificationNotes) { this.verificationNotes = verificationNotes; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public Boolean getIsFileDeleted() { return isFileDeleted; }
    public void setIsFileDeleted(Boolean isFileDeleted) { this.isFileDeleted = isFileDeleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
