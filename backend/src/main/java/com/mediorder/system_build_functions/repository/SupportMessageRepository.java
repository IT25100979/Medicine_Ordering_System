package com.mediorder.system_build_functions.repository;

import com.mediorder.system_build_functions.model.SupportMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {
    List<SupportMessage> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<SupportMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<SupportMessage> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
