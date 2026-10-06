package com.mediorder.repository;

import com.mediorder.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findBySessionId(String sessionId);

    List<CartItem> findByUserId(Long userId);

    @Query("SELECT c FROM CartItem c WHERE (:userId IS NOT NULL AND c.userId = :userId) OR (:sessionId IS NOT NULL AND c.sessionId = :sessionId)")
    List<CartItem> findBySessionIdOrUserId(@Param("sessionId") String sessionId, @Param("userId") Long userId);

    Optional<CartItem> findBySessionIdAndMedicineId(String sessionId, Long medicineId);

    Optional<CartItem> findByUserIdAndMedicineId(Long userId, Long medicineId);

    @Modifying
    @Transactional
    @Query("DELETE FROM CartItem c WHERE (:userId IS NOT NULL AND c.userId = :userId) OR (:sessionId IS NOT NULL AND c.sessionId = :sessionId)")
    void clearCart(@Param("sessionId") String sessionId, @Param("userId") Long userId);

    @Modifying
    @Transactional
    void deleteBySessionId(String sessionId);

    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
}
