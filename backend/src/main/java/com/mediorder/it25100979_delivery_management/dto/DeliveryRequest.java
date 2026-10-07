package com.mediorder.it25100979_delivery_management.dto;

import java.time.LocalDate;

public class DeliveryRequest {
    private Long userId;
    private String description;
    private Long pharmacistId;
    private String deliveryAddress;
    private Boolean coldChainTag;
    private LocalDate initialDate;
    private LocalDate finalDate;
    private String status;

    public DeliveryRequest() {}

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
