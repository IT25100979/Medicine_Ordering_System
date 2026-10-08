package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.dto.PasswordChangeRequest;
import com.mediorder.system_build_functions.dto.ProfileUpdateRequest;
import com.mediorder.system_build_functions.dto.UserResponse;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.model.UserStatus;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        return mapToResponse(user);
    }

    public UserResponse updateProfile(String email, ProfileUpdateRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            user.setFullName(req.getFullName().trim());
        }
        if (req.getContactNumber() != null) {
            user.setPhoneNumber(req.getContactNumber().trim());
        }
        if (req.getAvatarUrl() != null) {
            user.setAvatarUrl(req.getAvatarUrl().trim());
        }

        User saved = userRepository.save(user);
        auditService.logUserAction(user.getEmail(), user.getRole().name(), "PROFILE_UPDATED", "User", String.valueOf(user.getId()), "Updated profile information");
        return mapToResponse(saved);
    }

    public void changePassword(String email, PasswordChangeRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        if (req.getCurrentPassword() != null && !req.getCurrentPassword().isBlank()) {
            if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
                throw new AccessDeniedException("Current password does not match");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        auditService.logUserAction(user.getEmail(), user.getRole().name(), "PASSWORD_CHANGED", "User", String.valueOf(user.getId()), "Password changed successfully");
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse updateUserRole(Long userId, String roleName, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Role newRole = Role.valueOf(roleName.toUpperCase());
        Role oldRole = user.getRole();
        user.setRole(newRole);
        User saved = userRepository.save(user);

        auditService.logUserAction(adminEmail, "SYSTEM_ADMIN", "USER_ROLE_CHANGED", "User", String.valueOf(userId),
                "Role changed from " + oldRole + " to " + newRole);
        return mapToResponse(saved);
    }

    public UserResponse updateUserStatus(Long userId, String statusName, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        UserStatus newStatus = UserStatus.valueOf(statusName.toUpperCase());
        UserStatus oldStatus = user.getStatus();
        user.setStatus(newStatus);
        User saved = userRepository.save(user);

        auditService.logUserAction(adminEmail, "SYSTEM_ADMIN", "USER_STATUS_CHANGED", "User", String.valueOf(userId),
                "Status changed from " + oldStatus + " to " + newStatus);
        return mapToResponse(saved);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .contactNumber(user.getPhoneNumber())
                .role(user.getRole())
                .status(user.getStatus())
                .avatarUrl(user.getAvatarUrl())
                .isDemo(user.getIsDemo())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
