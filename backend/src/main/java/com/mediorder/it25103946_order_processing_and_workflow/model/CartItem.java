package com.mediorder.it25103946_order_processing_and_workflow.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cart_items")
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", length = 100)
    @JsonProperty("sessionId")
    @JsonAlias({"session_id", "sessionId"})
    private String sessionId;

    @Column(name = "user_id")
    @JsonProperty("userId")
    @JsonAlias({"user_id", "userId"})
    private Long userId;

    @Column(name = "medicine_id")
    @JsonProperty("medicineId")
    @JsonAlias({"medicine_id", "medicineId"})
    private Long medicineId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "generic_name")
    @JsonProperty("genericName")
    @JsonAlias({"generic_name", "genericName"})
    private String genericName;

    @Column(name = "category")
    private String category;

    @Column(name = "unit_price", precision = 10, scale = 2)
    @JsonProperty("unitPrice")
    @JsonAlias({"unit_price", "unitPrice", "price"})
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @Column(name = "image_url", length = 500)
    @JsonProperty("imageUrl")
    @JsonAlias({"image_url", "imageUrl"})
    private String imageUrl;

    @Column(name = "requires_prescription")
    @JsonProperty("requiresPrescription")
    @JsonAlias({"requires_prescription", "requiresPrescription"})
    private Boolean requiresPrescription = false;

    @Column(name = "created_at")
    @JsonProperty("createdAt")
    @JsonAlias({"created_at", "createdAt"})
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @JsonProperty("updatedAt")
    @JsonAlias({"updated_at", "updatedAt"})
    private LocalDateTime updatedAt = LocalDateTime.now();

    public CartItem() {
    }

    public CartItem(String sessionId, Long userId, Long medicineId, String name, String genericName, String category, BigDecimal unitPrice, Integer quantity, String imageUrl, Boolean requiresPrescription) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.medicineId = medicineId;
        this.name = name;
        this.genericName = genericName;
        this.category = category;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.imageUrl = imageUrl;
        this.requiresPrescription = requiresPrescription;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onPreUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Long medicineId) {
        this.medicineId = medicineId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGenericName() {
        return genericName;
    }

    public void setGenericName(String genericName) {
        this.genericName = genericName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getRequiresPrescription() {
        return requiresPrescription;
    }

    public void setRequiresPrescription(Boolean requiresPrescription) {
        this.requiresPrescription = requiresPrescription;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

