package com.medilink.service;

import com.medilink.dto.OrderRequestDTO;
import com.medilink.dto.OrderStatusUpdateDTO;
import com.medilink.entity.Order;
import java.util.List;

public interface OrderService {
    Order createOrder(OrderRequestDTO requestDTO);
    Order updateStatus(Long orderId, OrderStatusUpdateDTO updateDTO);
    List<Order> getOrdersByCustomer(Long customerId);
    Order getOrderById(Long orderId);
}