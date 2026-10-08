package com.mediorder.it25101923_prescription_management.model;

import com.mediorder.system_build_functions.model.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "original_file_name", length = 255)
    private String originalFileName;

    @Column(name = "stored_file_name", length = 255)
    private String storedFileName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "doctor_name", length = 150)
    private String doctorName;

    @Column(name = "patient_notes", columnDefinition = "TEXT")
    private String patientNotes;

    @Column(name = "chronic_subscription", nullable = false)
    private Boolean chronicSubscription = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PrescriptionStatus status = PrescriptionStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "is_file_deleted", nullable = false)
    private Boolean isFileDeleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Version
    @Column(columnDefinition = "BIGINT DEFAULT 0")
    private Long version = 0L;

    @Column(name = "file_sha256", length = 64)
    private String fileSha256;

    @Column(name = "rejection_code", length = 40)
    private String rejectionCode;

    @Column(name = "max_uses", columnDefinition = "INT DEFAULT 1")
    private Integer maxUses = 1;

    @Column(name = "used_count", columnDefinition = "INT DEFAULT 0")
    private Integer usedCount = 0;

    @Column(name = "archived", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean archived = false;

    public Long getVersion() { return version; }
    public void setVersion(Long value) { version = value; }
    public String getFileSha256() { return fileSha256; }
    public void setFileSha256(String value) { fileSha256 = value; }
    public String getRejectionCode() { return rejectionCode; }
    public void setRejectionCode(String value) { rejectionCode = value; }
    public Integer getMaxUses() { return maxUses == null ? 1 : maxUses; }
    public void setMaxUses(Integer value) { maxUses = value; }
    public Integer getUsedCount() { return usedCount == null ? 0 : usedCount; }
    public void setUsedCount(Integer value) { usedCount = value; }
    public Boolean getArchived() { return Boolean.TRUE.equals(archived); }
    public void setArchived(Boolean value) { archived = value; }

    public Prescription() {}

    public Prescription(Long id, User customer, String fileUrl, String originalFileName,
                        String storedFileName, String contentType, Long fileSizeBytes,
                        String doctorName, String patientNotes, Boolean chronicSubscription,
                        PrescriptionStatus status, User verifiedBy, LocalDateTime verifiedAt,
                        String verificationNotes, String rejectionReason, Boolean isFileDeleted,
                        LocalDateTime createdAt) {
        this.id = id;
        this.customer = customer;
        this.fileUrl = fileUrl;
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.contentType = contentType;
        this.fileSizeBytes = fileSizeBytes;
        this.doctorName = doctorName;
        this.patientNotes = patientNotes;
        this.chronicSubscription = chronicSubscription != null ? chronicSubscription : false;
        this.status = status != null ? status : PrescriptionStatus.PENDING;
        this.verifiedBy = verifiedBy;
        this.verifiedAt = verifiedAt;
        this.verificationNotes = verificationNotes;
        this.rejectionReason = rejectionReason;
        this.isFileDeleted = isFileDeleted != null ? isFileDeleted : false;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = PrescriptionStatus.PENDING;
        }
        if (this.chronicSubscription == null) {
            this.chronicSubscription = false;
        }
        if (this.isFileDeleted == null) {
            this.isFileDeleted = false;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

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

    public User getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(User verifiedBy) { this.verifiedBy = verifiedBy; }

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

    public static PrescriptionBuilder builder() {
        return new PrescriptionBuilder();
    }

    public static class PrescriptionBuilder {
        private Long id;
        private User customer;
        private String fileUrl;
        private String originalFileName;
        private String storedFileName;
        private String contentType;
        private Long fileSizeBytes;
        private String doctorName;
        private String patientNotes;
        private Boolean chronicSubscription = false;
        private PrescriptionStatus status = PrescriptionStatus.PENDING;
        private User verifiedBy;
        private LocalDateTime verifiedAt;
        private String verificationNotes;
        private String rejectionReason;
        private Boolean isFileDeleted = false;
        private LocalDateTime createdAt;

        public PrescriptionBuilder id(Long id) { this.id = id; return this; }
        public PrescriptionBuilder customer(User customer) { this.customer = customer; return this; }
        public PrescriptionBuilder fileUrl(String fileUrl) { this.fileUrl = fileUrl; return this; }
        public PrescriptionBuilder originalFileName(String originalFileName) { this.originalFileName = originalFileName; return this; }
        public PrescriptionBuilder storedFileName(String storedFileName) { this.storedFileName = storedFileName; return this; }
        public PrescriptionBuilder contentType(String contentType) { this.contentType = contentType; return this; }
        public PrescriptionBuilder fileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; return this; }
        public PrescriptionBuilder doctorName(String doctorName) { this.doctorName = doctorName; return this; }
        public PrescriptionBuilder patientNotes(String patientNotes) { this.patientNotes = patientNotes; return this; }
        public PrescriptionBuilder chronicSubscription(Boolean chronicSubscription) { this.chronicSubscription = chronicSubscription; return this; }
        public PrescriptionBuilder status(PrescriptionStatus status) { this.status = status; return this; }
        public PrescriptionBuilder verifiedBy(User verifiedBy) { this.verifiedBy = verifiedBy; return this; }
        public PrescriptionBuilder verifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; return this; }
        public PrescriptionBuilder verificationNotes(String verificationNotes) { this.verificationNotes = verificationNotes; return this; }
        public PrescriptionBuilder rejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; return this; }
        public PrescriptionBuilder isFileDeleted(Boolean isFileDeleted) { this.isFileDeleted = isFileDeleted; return this; }
        public PrescriptionBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Prescription build() {
            Prescription p = new Prescription();
            p.setId(this.id);
            p.setCustomer(this.customer);
            p.setFileUrl(this.fileUrl);
            p.setOriginalFileName(this.originalFileName);
            p.setStoredFileName(this.storedFileName);
            p.setContentType(this.contentType);
            p.setFileSizeBytes(this.fileSizeBytes);
            p.setDoctorName(this.doctorName);
            p.setPatientNotes(this.patientNotes);
            p.setChronicSubscription(this.chronicSubscription != null ? this.chronicSubscription : false);
            p.setStatus(this.status != null ? this.status : PrescriptionStatus.PENDING);
            p.setVerifiedBy(this.verifiedBy);
            p.setVerifiedAt(this.verifiedAt);
            p.setVerificationNotes(this.verificationNotes);
            p.setRejectionReason(this.rejectionReason);
            p.setIsFileDeleted(this.isFileDeleted != null ? this.isFileDeleted : false);
            p.setCreatedAt(this.createdAt != null ? this.createdAt : LocalDateTime.now());
            return p;
        }
    }
}

