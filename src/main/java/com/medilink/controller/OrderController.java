package com.medilink.controller;

import com.medilink.dto.OrderRequestDTO;
import com.medilink.dto.OrderStatusUpdateDTO;
import com.medilink.entity.Order;
import com.medilink.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    public Order createOrder(@RequestBody OrderRequestDTO requestDTO) {
        return orderService.createOrder(requestDTO);
    }

    @PutMapping("/{orderId}/status")
    public Order updateStatus(@PathVariable Long orderId, @RequestBody OrderStatusUpdateDTO updateDTO) {
        return orderService.updateStatus(orderId, updateDTO);
    }

    @GetMapping("/customer/{customerId}")
    public List<Order> getCustomerOrders(@PathVariable Long customerId) {
        return orderService.getOrdersByCustomer(customerId);
    }

    @GetMapping("/{orderId}")
    public Order getOrder(@PathVariable Long orderId) {
        return orderService.getOrderById(orderId);
    }
}