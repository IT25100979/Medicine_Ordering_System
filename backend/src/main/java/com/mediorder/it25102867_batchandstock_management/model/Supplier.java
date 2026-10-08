package com.mediorder.it25102867_batchandstock_management.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(length = 100)
    private String contactPerson;

    @Column(length = 150)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Supplier() {}

    public Supplier(Long id, String name, String contactPerson, String email, String phone,
                    String address, String licenseNumber, Boolean isActive, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.contactPerson = contactPerson;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.licenseNumber = licenseNumber;
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static SupplierBuilder builder() {
        return new SupplierBuilder();
    }

    public static class SupplierBuilder {
        private Long id;
        private String name;
        private String contactPerson;
        private String email;
        private String phone;
        private String address;
        private String licenseNumber;
        private Boolean isActive = true;
        private LocalDateTime createdAt;

        public SupplierBuilder id(Long id) { this.id = id; return this; }
        public SupplierBuilder name(String name) { this.name = name; return this; }
        public SupplierBuilder contactPerson(String contactPerson) { this.contactPerson = contactPerson; return this; }
        public SupplierBuilder email(String email) { this.email = email; return this; }
        public SupplierBuilder phone(String phone) { this.phone = phone; return this; }
        public SupplierBuilder address(String address) { this.address = address; return this; }
        public SupplierBuilder licenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; return this; }
        public SupplierBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public SupplierBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Supplier build() {
            return new Supplier(id, name, contactPerson, email, phone, address, licenseNumber, isActive, createdAt);
        }
    }
}
