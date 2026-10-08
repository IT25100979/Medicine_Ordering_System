package com.mediorder.it25103946_order_processing_and_workflow.service;

import com.mediorder.it25103946_order_processing_and_workflow.model.Order;
import com.mediorder.it25103946_order_processing_and_workflow.model.OrderStatus;
import com.mediorder.it25103946_order_processing_and_workflow.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired private com.mediorder.it25101923_prescription_management.service.PrescriptionService prescriptionService;
    @Autowired private com.mediorder.system_build_functions.repository.UserRepository userRepository;

    public Order createOrder(Order order,org.springframework.security.core.Authentication authentication) {
        var user=userRepository.findByEmail(authentication.getName()).orElseThrow(()->new org.springframework.security.access.AccessDeniedException("Account not found."));
        order.setId(null);order.setCustomer(user);order.setOrderStatus(com.mediorder.it25103946_order_processing_and_workflow.model.OrderStatus.PLACED);
        Order saved=orderRepository.saveAndFlush(order);
        if(saved.getPrescriptionId()!=null) prescriptionService.reserveForOrder(saved.getPrescriptionId(),saved,user);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }

    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }

    public Optional<Order> updateOrderStatus(Long orderId, OrderStatus status) {
        return orderRepository.findById(orderId).map(order -> {
            order.setOrderStatus(status);
            return orderRepository.save(order);
        });
    }
}
