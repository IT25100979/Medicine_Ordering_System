package com.mediorder.system_build_functions.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "addresses", indexes = {
    @Index(name = "idx_address_user", columnList = "user_id")
})
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 50)
    private String label = "Home"; // Home, Office, Clinic

    @Column(name = "line1", nullable = false, length = 255)
    private String line1;

    @Column(name = "line2", length = 255)
    private String line2;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(length = 100)
    private String region;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(length = 100)
    private String country = "Sri Lanka";

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "is_default_shipping", nullable = false)
    private Boolean isDefaultShipping = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Address() {}

    public Address(Long id, User user, String label, String line1, String line2, String city,
                   String region, String postalCode, String country, String contactPhone,
                   Boolean isDefaultShipping, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.label = label != null ? label : "Home";
        this.line1 = line1;
        this.line2 = line2;
        this.city = city;
        this.region = region;
        this.postalCode = postalCode;
        this.country = country != null ? country : "Sri Lanka";
        this.contactPhone = contactPhone;
        this.isDefaultShipping = isDefaultShipping != null ? isDefaultShipping : false;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.label == null) {
            this.label = "Home";
        }
        if (this.country == null) {
            this.country = "Sri Lanka";
        }
        if (this.isDefaultShipping == null) {
            this.isDefaultShipping = false;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getLine1() { return line1; }
    public void setLine1(String line1) { this.line1 = line1; }
    public String getLine2() { return line2; }
    public void setLine2(String line2) { this.line2 = line2; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public Boolean getIsDefaultShipping() { return isDefaultShipping; }
    public void setIsDefaultShipping(Boolean isDefaultShipping) { this.isDefaultShipping = isDefaultShipping; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static AddressBuilder builder() {
        return new AddressBuilder();
    }

    public static class AddressBuilder {
        private Long id;
        private User user;
        private String label = "Home";
        private String line1;
        private String line2;
        private String city;
        private String region;
        private String postalCode;
        private String country = "Sri Lanka";
        private String contactPhone;
        private Boolean isDefaultShipping = false;
        private LocalDateTime createdAt;

        public AddressBuilder id(Long id) { this.id = id; return this; }
        public AddressBuilder user(User user) { this.user = user; return this; }
        public AddressBuilder label(String label) { this.label = label; return this; }
        public AddressBuilder line1(String line1) { this.line1 = line1; return this; }
        public AddressBuilder line2(String line2) { this.line2 = line2; return this; }
        public AddressBuilder city(String city) { this.city = city; return this; }
        public AddressBuilder region(String region) { this.region = region; return this; }
        public AddressBuilder postalCode(String postalCode) { this.postalCode = postalCode; return this; }
        public AddressBuilder country(String country) { this.country = country; return this; }
        public AddressBuilder contactPhone(String contactPhone) { this.contactPhone = contactPhone; return this; }
        public AddressBuilder isDefaultShipping(Boolean isDefaultShipping) { this.isDefaultShipping = isDefaultShipping; return this; }
        public AddressBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Address build() {
            return new Address(id, user, label, line1, line2, city, region, postalCode, country, contactPhone, isDefaultShipping, createdAt);
        }
    }
}
