package com.mediorder.it25100979_delivery_management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DeliveryCreationRequest {
    @JsonProperty("customerName")
    private String customerName;

    @JsonProperty("orderAddress")
    private String orderAddress;

    @JsonProperty("customerPhone")
    private String customerPhone;

    @JsonProperty("customerEmail")
    private String customerEmail;

    @JsonProperty("specialInstructions")
    private String specialInstructions;

    @JsonProperty("validatingPharmacist")
    private String validatingPharmacist;

    @JsonProperty("arrangingStaff")
    private String arrangingStaff;

    @JsonProperty("batchId")
    private String batchId;

    @JsonProperty("assignedRoute")
    private String assignedRoute;

    @JsonProperty("assignedCourier")
    private String assignedCourier;

    @JsonProperty("userId")
    private Long userId;

    @JsonProperty("deliveryAddress")
    private String deliveryAddress;

    @JsonProperty("coldChainTag")
    private Boolean coldChainTag;

    public DeliveryCreationRequest() {}

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getOrderAddress() { return orderAddress; }
    public void setOrderAddress(String orderAddress) { this.orderAddress = orderAddress; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public String getValidatingPharmacist() { return validatingPharmacist; }
    public void setValidatingPharmacist(String validatingPharmacist) { this.validatingPharmacist = validatingPharmacist; }

    public String getArrangingStaff() { return arrangingStaff; }
    public void setArrangingStaff(String arrangingStaff) { this.arrangingStaff = arrangingStaff; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getAssignedRoute() { return assignedRoute; }
    public void setAssignedRoute(String assignedRoute) { this.assignedRoute = assignedRoute; }

    public String getAssignedCourier() { return assignedCourier; }
    public void setAssignedCourier(String assignedCourier) { this.assignedCourier = assignedCourier; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public Boolean getColdChainTag() { return coldChainTag; }
    public void setColdChainTag(Boolean coldChainTag) { this.coldChainTag = coldChainTag; }
}
