package com.mediorder.system_build_functions.repository;

import com.mediorder.system_build_functions.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    java.util.List<User> findByRole(com.mediorder.system_build_functions.model.Role role);
}


