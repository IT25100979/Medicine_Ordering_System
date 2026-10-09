package com.mediorder.it25100979_delivery_management.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import com.fasterxml.jackson.annotation.JsonSetter;

@Entity
@Table(name = "delivery_zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "city", nullable = false)
    private String city;

    @Column(name = "postal_code", nullable = false)
    @JsonProperty("postal_code")
    private String postalCode;

    @Column(name = "is_active", nullable = false)
    @JsonProperty("is_active")
    private Integer isActive;

    @Column(name = "delivery_fee", nullable = false)
    @JsonProperty("delivery_fee")
    private Double deliveryFee;

    @Column(name = "estimated_delivery_time")
    @JsonProperty("estimated_delivery_time")
    private Integer estimatedDeliveryTime;

    @Column(name = "esitmated_delivery_time")
    @JsonProperty("esitmated_delivery_time")
    private Integer esitmatedDeliveryTime;

    @Column(name = "created_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @JsonProperty("created_at")
    private LocalDate createdAt;

    @PrePersist
    @PreUpdate
    public void syncEstimatedTime() {
        if (this.estimatedDeliveryTime != null && this.esitmatedDeliveryTime == null) {
            this.esitmatedDeliveryTime = this.estimatedDeliveryTime;
        } else if (this.esitmatedDeliveryTime != null && this.estimatedDeliveryTime == null) {
            this.estimatedDeliveryTime = this.esitmatedDeliveryTime;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public Integer getIsActive() {
        return isActive;
    }

    public void setIsActive(Integer isActive) {
        this.isActive = isActive;
    }

    public Double getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(Double deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public Integer getEstimatedDeliveryTime() {
        return estimatedDeliveryTime != null ? estimatedDeliveryTime : esitmatedDeliveryTime;
    }

    public void setEstimatedDeliveryTime(Integer estimatedDeliveryTime) {
        this.estimatedDeliveryTime = estimatedDeliveryTime;
        if (this.esitmatedDeliveryTime == null) {
            this.esitmatedDeliveryTime = estimatedDeliveryTime;
        }
    }

    public Integer getEsitmatedDeliveryTime() {
        return esitmatedDeliveryTime != null ? esitmatedDeliveryTime : estimatedDeliveryTime;
    }

    public void setEsitmatedDeliveryTime(Integer esitmatedDeliveryTime) {
        this.esitmatedDeliveryTime = esitmatedDeliveryTime;
        if (this.estimatedDeliveryTime == null) {
            this.estimatedDeliveryTime = esitmatedDeliveryTime;
        }
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }

    @JsonSetter("created_at")
    public void setCreatedAtFromJson(Object val) {
        if (val == null) {
            this.createdAt = null;
            return;
        }
        if (val instanceof LocalDate ld) {
            this.createdAt = ld;
            return;
        }
        String str = val.toString().trim();
        if (str.isEmpty()) {
            this.createdAt = null;
            return;
        }
        try {
            if (str.contains("-")) {
                this.createdAt = LocalDate.parse(str, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            } else if (str.contains("/")) {
                this.createdAt = LocalDate.parse(str, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            } else {
                this.createdAt = LocalDate.parse(str);
            }
        } catch (Exception e) {
            try {
                this.createdAt = LocalDate.parse(str);
            } catch (Exception ignored) {
                this.createdAt = LocalDate.now();
            }
        }
    }
}

