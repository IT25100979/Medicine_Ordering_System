package com.mediorder.it25103946_order_processing_and_workflow.repository;

import com.mediorder.it25103946_order_processing_and_workflow.model.ReservationStatus;
import com.mediorder.it25103946_order_processing_and_workflow.model.StockReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockReservationRepository extends JpaRepository<StockReservation, Long> {
    List<StockReservation> findByOrderId(Long orderId);
    List<StockReservation> findByOrderIdAndStatus(Long orderId, ReservationStatus status);

    @Query("SELECT r FROM StockReservation r WHERE r.status = 'RESERVED' AND r.expiresAt IS NOT NULL AND r.expiresAt < :now")
    List<StockReservation> findExpiredReservations(@Param("now") LocalDateTime now);
}
