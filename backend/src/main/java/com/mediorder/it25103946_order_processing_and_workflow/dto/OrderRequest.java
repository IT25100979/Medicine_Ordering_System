package com.mediorder.it25103946_order_processing_and_workflow.dto;

import java.math.BigDecimal;
import java.util.List;

public class OrderRequest {
    private Long customerId;
    private String shippingAddress;
    private BigDecimal totalAmount;
    private List<Long> cartItemIds;

    public OrderRequest() {}

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public List<Long> getCartItemIds() { return cartItemIds; }
    public void setCartItemIds(List<Long> cartItemIds) { this.cartItemIds = cartItemIds; }
}
