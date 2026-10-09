package com.mediorder.it25100979_delivery_management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CourierDeliveryResponse {
    @JsonProperty("deliveryId")
    private Long deliveryId;

    @JsonProperty("batchId")
    private String batchId;

    @JsonProperty("customerName")
    private String customerName;

    @JsonProperty("orderAddress")
    private String orderAddress;

    @JsonProperty("customerPhone")
    private String customerPhone;

    @JsonProperty("status")
    private String status;

    @JsonProperty("assignedCourier")
    private String assignedCourier;

    @JsonProperty("assignedRoute")
    private String assignedRoute;

    public CourierDeliveryResponse() {}

    public CourierDeliveryResponse(Long deliveryId, String batchId, String customerName, 
                                   String orderAddress, String customerPhone, String status, 
                                   String assignedCourier, String assignedRoute) {
        this.deliveryId = deliveryId;
        this.batchId = batchId;
        this.customerName = customerName;
        this.orderAddress = orderAddress;
        this.customerPhone = customerPhone;
        this.status = status;
        this.assignedCourier = assignedCourier;
        this.assignedRoute = assignedRoute;
    }

    public Long getDeliveryId() { return deliveryId; }
    public void setDeliveryId(Long deliveryId) { this.deliveryId = deliveryId; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getOrderAddress() { return orderAddress; }
    public void setOrderAddress(String orderAddress) { this.orderAddress = orderAddress; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAssignedCourier() { return assignedCourier; }
    public void setAssignedCourier(String assignedCourier) { this.assignedCourier = assignedCourier; }

    public String getAssignedRoute() { return assignedRoute; }
    public void setAssignedRoute(String assignedRoute) { this.assignedRoute = assignedRoute; }

    public static CourierDeliveryResponseBuilder builder() {
        return new CourierDeliveryResponseBuilder();
    }

    public static class CourierDeliveryResponseBuilder {
        private Long deliveryId;
        private String batchId;
        private String customerName;
        private String orderAddress;
        private String customerPhone;
        private String status;
        private String assignedCourier;
        private String assignedRoute;

        public CourierDeliveryResponseBuilder deliveryId(Long deliveryId) { this.deliveryId = deliveryId; return this; }
        public CourierDeliveryResponseBuilder batchId(String batchId) { this.batchId = batchId; return this; }
        public CourierDeliveryResponseBuilder customerName(String customerName) { this.customerName = customerName; return this; }
        public CourierDeliveryResponseBuilder orderAddress(String orderAddress) { this.orderAddress = orderAddress; return this; }
        public CourierDeliveryResponseBuilder customerPhone(String customerPhone) { this.customerPhone = customerPhone; return this; }
        public CourierDeliveryResponseBuilder status(String status) { this.status = status; return this; }
        public CourierDeliveryResponseBuilder assignedCourier(String assignedCourier) { this.assignedCourier = assignedCourier; return this; }
        public CourierDeliveryResponseBuilder assignedRoute(String assignedRoute) { this.assignedRoute = assignedRoute; return this; }

        public CourierDeliveryResponse build() {
            return new CourierDeliveryResponse(deliveryId, batchId, customerName, orderAddress, customerPhone, status, assignedCourier, assignedRoute);
        }
    }
}
