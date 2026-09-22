package com.medilink.service;

import com.medilink.dto.OrderRequestDTO;
import com.medilink.dto.OrderStatusUpdateDTO;
import com.medilink.entity.Order;
import com.medilink.entity.OrderItem;
import com.medilink.entity.OrderStatus;
import com.medilink.exception.InvalidOrderStateException;
import com.medilink.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

    private static final Map<OrderStatus, List<OrderStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(OrderStatus.class);
    static {
        ALLOWED_TRANSITIONS.put(OrderStatus.PENDING_VERIFICATION,
                List.of(OrderStatus.APPROVED, OrderStatus.CANCELLED));
        ALLOWED_TRANSITIONS.put(OrderStatus.APPROVED,
                List.of(OrderStatus.PACKING, OrderStatus.CANCELLED));
        ALLOWED_TRANSITIONS.put(OrderStatus.PACKING,
                List.of(OrderStatus.DISPATCHED));
        ALLOWED_TRANSITIONS.put(OrderStatus.DISPATCHED,
                List.of(OrderStatus.DELIVERED));
        ALLOWED_TRANSITIONS.put(OrderStatus.DELIVERED, List.of());
        ALLOWED_TRANSITIONS.put(OrderStatus.CANCELLED, List.of());
    }

    @Override
    public Order createOrder(OrderRequestDTO requestDTO) {
        Order order = new Order();
        order.setCustomerId(requestDTO.getCustomerId());
        order.setStatus(OrderStatus.PENDING_VERIFICATION);

        List<OrderItem> items = requestDTO.getItems().stream().map(i -> {
            OrderItem item = new OrderItem();
            item.setMedicineId(i.getMedicineId());
            item.setQuantityOrdered(i.getQuantity());
            item.setOrder(order);
            return item;
        }).collect(Collectors.toList());

        order.setItems(items);
        return orderRepository.save(order);
    }

    @Override
    public Order updateStatus(Long orderId, OrderStatusUpdateDTO updateDTO) {
        Order order = getOrderById(orderId);
        OrderStatus current = order.getStatus();
        OrderStatus newStatus = updateDTO.getNewStatus();

        if (!ALLOWED_TRANSITIONS.get(current).contains(newStatus)) {
            throw new InvalidOrderStateException(
                    "Cannot move order from " + current + " to " + newStatus);
        }

        if (newStatus == OrderStatus.CANCELLED
                && (current == OrderStatus.PACKING || current == OrderStatus.DISPATCHED)) {
            throw new InvalidOrderStateException("Packed/Dispatched orders cannot be cancelled");
        }

        order.setStatus(newStatus);
        if (newStatus == OrderStatus.CANCELLED) {
            order.setCancellationReason(updateDTO.getReason());
        }
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    @Override
    public List<Order> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }

    @Override
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new InvalidOrderStateException("Order not found: " + orderId));
    }
}