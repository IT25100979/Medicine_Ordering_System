package com.mediorder.it25100979_delivery_management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

public class AssignDeliveryRequest {
    @JsonProperty("deliveryIds")
    private List<Long> deliveryIds;

    @JsonProperty("deliveryId")
    private Long deliveryId;

    @JsonProperty("batchId")
    private String batchId;

    @JsonProperty("route")
    private String route;

    @JsonProperty("courier")
    private String courier;

    public AssignDeliveryRequest() {}

    public List<Long> getDeliveryIds() { return deliveryIds; }
    public void setDeliveryIds(List<Long> deliveryIds) { this.deliveryIds = deliveryIds; }

    public Long getDeliveryId() { return deliveryId; }
    public void setDeliveryId(Long deliveryId) { this.deliveryId = deliveryId; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }

    public String getCourier() { return courier; }
    public void setCourier(String courier) { this.courier = courier; }

    public List<Long> resolveDeliveryIds() {
        List<Long> ids = new ArrayList<>();
        if (deliveryIds != null && !deliveryIds.isEmpty()) {
            ids.addAll(deliveryIds);
        } else if (deliveryId != null) {
            ids.add(deliveryId);
        }
        return ids;
    }
}
