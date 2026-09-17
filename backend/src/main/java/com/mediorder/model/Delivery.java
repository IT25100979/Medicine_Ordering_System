package com.mediorder.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "deliveries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "pharmacist_id")
    private Long pharmacistId;

    @Column(name = "delivery_address", nullable = false)
    private String deliveryAddress;

    @Column(name = "cold_chain_tag")
    private Boolean coldChainTag;

    @Column(name = "initial_date")
    private LocalDate initialDate;

    @Column(name = "final_date")
    private LocalDate finalDate;

    @Column(nullable = false)
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getPharmacistId() { return pharmacistId; }
    public void setPharmacistId(Long pharmacistId) { this.pharmacistId = pharmacistId; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public Boolean getColdChainTag() { return coldChainTag; }
    public void setColdChainTag(Boolean coldChainTag) { this.coldChainTag = coldChainTag; }
    public LocalDate getInitialDate() { return initialDate; }
    public void setInitialDate(LocalDate initialDate) { this.initialDate = initialDate; }
    public LocalDate getFinalDate() { return finalDate; }
    public void setFinalDate(LocalDate finalDate) { this.finalDate = finalDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
