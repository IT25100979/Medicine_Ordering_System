package com.mediorder.system_build_functions.repository;

import com.mediorder.system_build_functions.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdOrderBySentAtDesc(Long recipientId);

    List<Notification> findByRecipientIdAndIsReadFalse(Long recipientId);

    long countByRecipientIdAndIsReadFalse(Long recipientId);
}


