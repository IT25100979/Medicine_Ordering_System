package com.mediorder.system_build_functions.repository;

import com.mediorder.system_build_functions.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE (:department IS NULL OR LOWER(a.department) = LOWER(:department)) ORDER BY a.createdAt DESC")
    Page<AuditLog> findByDepartmentFilter(@Param("department") String department, Pageable pageable);

    List<AuditLog> findByEntityAndEntityIdOrderByCreatedAtDesc(String entity, String entityId);
    Page<AuditLog> findByActorRoleOrderByCreatedAtDesc(String actorRole, Pageable pageable);
    Page<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);
}
