package com.mediorder.it25101923_prescription_management.model;

import jakarta.persistence.*;

/**
 * Entity tracking prescription file SHA-256 fingerprints to prevent duplicate uploads.
 * Maps both sha256 and document_hash column variations for database compatibility.
 * IT25101923
 */
@Entity
@Table(name = "prescription_fingerprints")
public class PrescriptionFingerprint {

    @Id
    @Column(name = "sha256", length = 64)
    private String sha256;

    @Column(name = "document_hash", length = 64)
    private String documentHash;

    @Column(name = "prescription_id", nullable = false)
    private Long prescriptionId;

    @Version
    private Long version;

    public PrescriptionFingerprint() {}

    public PrescriptionFingerprint(String hash, Long id) {
        this.sha256 = hash;
        this.documentHash = hash;
        this.prescriptionId = id;
    }

    public String getSha256() {
        return sha256;
    }

    public void setSha256(String sha256) {
        this.sha256 = sha256;
    }

    public String getDocumentHash() {
        return documentHash;
    }

    public void setDocumentHash(String documentHash) {
        this.documentHash = documentHash;
    }

    public Long getPrescriptionId() {
        return prescriptionId;
    }

    public void setPrescriptionId(Long prescriptionId) {
        this.prescriptionId = prescriptionId;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
}
