package com.mediorder.service;

import com.mediorder.dto.*;
import com.mediorder.exception.InvalidOrderStateException;
import com.mediorder.exception.ResourceNotFoundException;
import com.mediorder.model.*;
import com.mediorder.repository.AuditLogRepository;
import com.mediorder.repository.InventoryBatchRepository;
import com.mediorder.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final InventoryBatchRepository batchRepository;
    private final AuditLogRepository auditLogRepository;
    private final FefoAllocationService fefoAllocationService;

    public OrderService(OrderRepository orderRepository,
                        InventoryBatchRepository batchRepository,
                        AuditLogRepository auditLogRepository,
                        FefoAllocationService fefoAllocationService) {
        this.orderRepository = orderRepository;
        this.batchRepository = batchRepository;
        this.auditLogRepository = auditLogRepository;
        this.fefoAllocationService = fefoAllocationService;
    }

    @Transactional
    public OrderResponse placeOrder(CreateOrderRequest request) {
        Order order = new Order();
        String orderNumber = "ORD-" + System.currentTimeMillis() % 1000000 + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        order.setOrderNumber(orderNumber);
        order.setUserId(request.getUserId() != null && !request.getUserId().isBlank() ? request.getUserId() : "cust_anonymous");
        order.setCustomerName(request.getCustomerName());
        order.setCustomerEmail(request.getCustomerEmail());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setShippingAddress(request.getShippingAddress());
        order.setStatus(OrderStatus.CLINICAL_REVIEW);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            List<FefoAllocationService.AllocationResult> allocations =
                    fefoAllocationService.allocateStockFefo(itemReq.getMedicineId(), itemReq.getQuantity());

            for (FefoAllocationService.AllocationResult alloc : allocations) {
                InventoryBatch batch = alloc.getBatch();
                Medicine medicine = batch.getMedicine();

                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);
                orderItem.setMedicine(medicine);
                orderItem.setInventoryBatch(batch);
                orderItem.setQuantity(alloc.getAllocatedQuantity());
                orderItem.setUnitPrice(medicine.getUnitPrice());
                orderItem.setSubtotal(medicine.getUnitPrice().multiply(BigDecimal.valueOf(alloc.getAllocatedQuantity())));
                orderItem.setAllocatedBatchNumber(batch.getBatchNumber());
                orderItem.setShelfLocation(batch.getShelfLocation());

                order.addItem(orderItem);
                totalAmount = totalAmount.add(orderItem.getSubtotal());
            }
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);

        auditLogRepository.save(new AuditLog(
                "ORDER_PLACED",
                "Order",
                savedOrder.getId().toString(),
                order.getUserId(),
                String.format("Order placed with %d allocated items, total: $%s", savedOrder.getItems().size(), totalAmount)
        ));

        log.info("Successfully placed order {} with total amount ${}", savedOrder.getOrderNumber(), totalAmount);
        return mapToOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));
        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with order number: " + orderNumber));
        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(String userId, OrderStatus status) {
        List<Order> orders;
        if (userId != null && !userId.isBlank()) {
            orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } else if (status != null) {
            orders = orderRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc();
        }
        return orders.stream().map(this::mapToOrderResponse).collect(Collectors.toList());
    }

    /**
     * Validates and advances order state machine:
     * PLACED -> VERIFIED -> PACKED -> OUT_FOR_DELIVERY -> DELIVERED
     */
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus, String note, String updatedBy) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        validateStatusTransition(order.getStatus(), newStatus);

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);

        auditLogRepository.save(new AuditLog(
                "ORDER_STATUS_CHANGED",
                "Order",
                order.getId().toString(),
                updatedBy != null ? updatedBy : "system",
                String.format("Status changed from %s to %s. Note: %s", oldStatus, newStatus, note != null ? note : "None")
        ));

        log.info("Order {} transitioned from {} to {}", order.getOrderNumber(), oldStatus, newStatus);
        return mapToOrderResponse(updatedOrder);
    }

    /**
     * Cancels an order and automatically restocks batch inventory (SP3-06 / PBI-18 / T-04.4).
     */
    @Transactional
    public OrderResponse cancelOrder(Long orderId, String reason, String cancelledBy) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new InvalidOrderStateException("Cannot cancel an order that has already been delivered");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new InvalidOrderStateException("Order is already cancelled");
        }

        // Restock unfulfilled batches back into active inventory pool
        for (OrderItem item : order.getItems()) {
            InventoryBatch batch = item.getInventoryBatch();
            if (batch != null) {
                int restoredQty = batch.getQuantityAvailable() + item.getQuantity();
                batch.setQuantityAvailable(restoredQty);
                batchRepository.save(batch);
                log.info("Restocked {} units of {} back into Batch {}", item.getQuantity(), item.getMedicine().getName(), batch.getBatchNumber());
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason);
        Order savedOrder = orderRepository.save(order);

        auditLogRepository.save(new AuditLog(
                "ORDER_CANCELLED_RESTOCKED",
                "Order",
                order.getId().toString(),
                cancelledBy != null ? cancelledBy : "customer",
                String.format("Order cancelled. Reason: %s. Batches restocked.", reason)
        ));

        return mapToOrderResponse(savedOrder);
    }

    /**
     * Generates a pharmacy packing slip with allocated batch numbers and shelf locations (T-06.4).
     */
    @Transactional(readOnly = true)
    public PackingSlipResponse generatePackingSlip(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        PackingSlipResponse slip = new PackingSlipResponse();
        slip.setOrderNumber(order.getOrderNumber());
        slip.setCustomerName(order.getCustomerName());
        slip.setCustomerPhone(order.getCustomerPhone());
        slip.setShippingAddress(order.getShippingAddress());
        slip.setOrderStatus(order.getStatus().name());
        slip.setOrderDate(order.getCreatedAt());
        slip.setInstructions("Verify batch serial numbers against shelf locations before sealing package.");

        List<PackingSlipItemDto> items = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            PackingSlipItemDto slipItem = new PackingSlipItemDto(
                    item.getMedicine().getName(),
                    item.getMedicine().getDosage(),
                    item.getQuantity(),
                    item.getAllocatedBatchNumber(),
                    item.getInventoryBatch() != null ? item.getInventoryBatch().getExpiryDate() : null,
                    item.getShelfLocation()
            );
            items.add(slipItem);
        }
        slip.setItems(items);
        return slip;
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        if (current == OrderStatus.CANCELLED) {
            throw new InvalidOrderStateException("Cannot update status of a cancelled order");
        }
        if (current == OrderStatus.DELIVERED) {
            throw new InvalidOrderStateException("Cannot update status of an already delivered order");
        }
        if (next == OrderStatus.CANCELLED) {
            return; // Cancel handles its own logic
        }

        boolean valid = false;
        switch (current) {
            case CLINICAL_REVIEW:
            case PLACED:
            case VERIFIED:
                valid = (next == OrderStatus.PACKED);
                break;
            case PACKED:
                valid = (next == OrderStatus.OUT_FOR_DELIVERY);
                break;
            case OUT_FOR_DELIVERY:
                valid = (next == OrderStatus.DELIVERED);
                break;
            default:
                valid = false;
        }

        if (!valid) {
            throw new InvalidOrderStateException(
                    String.format("Invalid order state transition from %s to %s", current, next));
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        OrderResponse res = new OrderResponse();
        res.setId(order.getId());
        res.setOrderNumber(order.getOrderNumber());
        res.setUserId(order.getUserId());
        res.setCustomerName(order.getCustomerName());
        res.setCustomerEmail(order.getCustomerEmail());
        res.setCustomerPhone(order.getCustomerPhone());
        res.setShippingAddress(order.getShippingAddress());
        res.setStatus(order.getStatus());
        res.setTotalAmount(order.getTotalAmount());
        res.setCancellationReason(order.getCancellationReason());
        res.setCreatedAt(order.getCreatedAt());
        res.setUpdatedAt(order.getUpdatedAt());

        // Dynamic estimated timestamps (T-04.4)
        if (order.getCreatedAt() != null) {
            res.setEstimatedDispatchTime(order.getCreatedAt().plusHours(4));
            res.setEstimatedDeliveryTime(order.getCreatedAt().plusHours(24));
        }

        List<OrderItemResponse> itemResponses = order.getItems().stream().map(item -> {
            OrderItemResponse ir = new OrderItemResponse();
            ir.setId(item.getId());
            ir.setMedicineId(item.getMedicine().getId());
            ir.setMedicineName(item.getMedicine().getName());
            ir.setDosage(item.getMedicine().getDosage());
            if (item.getInventoryBatch() != null) {
                ir.setBatchId(item.getInventoryBatch().getId());
                ir.setBatchNumber(item.getAllocatedBatchNumber());
            }
            ir.setShelfLocation(item.getShelfLocation());
            ir.setQuantity(item.getQuantity());
            ir.setUnitPrice(item.getUnitPrice());
            ir.setSubtotal(item.getSubtotal());
            return ir;
        }).collect(Collectors.toList());

        res.setItems(itemResponses);
        return res;
    }
}
