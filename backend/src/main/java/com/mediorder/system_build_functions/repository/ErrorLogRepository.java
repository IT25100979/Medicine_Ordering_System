package com.mediorder.system_build_functions.repository;

import com.mediorder.system_build_functions.model.ErrorLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ErrorLogRepository extends JpaRepository<ErrorLog, Long> {
    Page<ErrorLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<ErrorLog> findByResolvedFalseOrderByCreatedAtDesc(Pageable pageable);
    Page<ErrorLog> findBySeverityOrderByCreatedAtDesc(String severity, Pageable pageable);
}
