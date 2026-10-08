package com.mediorder.it25103946_order_processing_and_workflow.model;

import com.mediorder.it25102867_batchandstock_management.model.InventoryBatch;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_reservations", indexes = {
    @Index(name = "idx_res_order", columnList = "order_id"),
    @Index(name = "idx_res_batch", columnList = "batch_id"),
    @Index(name = "idx_res_status", columnList = "status")
})
public class StockReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private InventoryBatch batch;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReservationStatus status = ReservationStatus.RESERVED;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public StockReservation() {}

    public StockReservation(Long id, Long orderId, InventoryBatch batch, Integer quantity,
                            ReservationStatus status, LocalDateTime expiresAt, LocalDateTime createdAt) {
        this.id = id;
        this.orderId = orderId;
        this.batch = batch;
        this.quantity = quantity;
        this.status = status != null ? status : ReservationStatus.RESERVED;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = ReservationStatus.RESERVED;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public InventoryBatch getBatch() { return batch; }
    public void setBatch(InventoryBatch batch) { this.batch = batch; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static StockReservationBuilder builder() {
        return new StockReservationBuilder();
    }

    public static class StockReservationBuilder {
        private Long id;
        private Long orderId;
        private InventoryBatch batch;
        private Integer quantity;
        private ReservationStatus status = ReservationStatus.RESERVED;
        private LocalDateTime expiresAt;
        private LocalDateTime createdAt;

        public StockReservationBuilder id(Long id) { this.id = id; return this; }
        public StockReservationBuilder orderId(Long orderId) { this.orderId = orderId; return this; }
        public StockReservationBuilder batch(InventoryBatch batch) { this.batch = batch; return this; }
        public StockReservationBuilder quantity(Integer quantity) { this.quantity = quantity; return this; }
        public StockReservationBuilder status(ReservationStatus status) { this.status = status; return this; }
        public StockReservationBuilder expiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; return this; }
        public StockReservationBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public StockReservation build() {
            return new StockReservation(id, orderId, batch, quantity, status, expiresAt, createdAt);
        }
    }
}
