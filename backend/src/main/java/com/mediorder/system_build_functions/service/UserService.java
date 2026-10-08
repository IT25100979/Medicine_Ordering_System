package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.dto.*;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.model.UserStatus;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + email));
        return mapToResponse(user);
    }

    public UserResponse updateProfile(String email, ProfileUpdateRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + email));

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + email));

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

    public UserResponse createUser(AdminUserCreateRequest req, String adminEmail) {
        if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User email already exists: " + req.getEmail());
        }

        User user = User.builder()
                .fullName(req.getFullName().trim())
                .email(req.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole() != null ? req.getRole() : Role.CUSTOMER)
                .status(req.getStatus() != null ? req.getStatus() : UserStatus.ACTIVE)
                .phoneNumber(req.getPhoneNumber())
                .avatarUrl(req.getAvatarUrl())
                .isDemo(false)
                .createdAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        auditService.logUserAction(adminEmail, "SYSTEM_ADMIN", "CREATE_USER_PROFILE", "User", String.valueOf(saved.getId()),
                "Created user profile: " + saved.getEmail() + " (" + saved.getRole() + ")");
        return mapToResponse(saved);
    }

    public UserResponse updateUser(Long userId, AdminUserUpdateRequest req, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            String newEmail = req.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            user.setFullName(req.getFullName().trim());
        }
        if (req.getRole() != null) {
            user.setRole(req.getRole());
        }
        if (req.getStatus() != null) {
            user.setStatus(req.getStatus());
        }
        if (req.getPhoneNumber() != null) {
            user.setPhoneNumber(req.getPhoneNumber().trim());
        }
        if (req.getAvatarUrl() != null) {
            user.setAvatarUrl(req.getAvatarUrl().trim());
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }

        User saved = userRepository.save(user);
        auditService.logUserAction(adminEmail, "SYSTEM_ADMIN", "UPDATE_USER_PROFILE", "User", String.valueOf(saved.getId()),
                "Updated user profile: " + saved.getEmail() + " (" + saved.getRole() + ", " + saved.getStatus() + ")");
        return mapToResponse(saved);
    }

    public void deleteUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete your own active admin account");
        }

        userRepository.delete(user);
        auditService.logUserAction(adminEmail, "SYSTEM_ADMIN", "DELETE_USER_PROFILE", "User", String.valueOf(userId),
                "Deleted user profile: " + user.getEmail() + " (" + user.getRole() + ")");
    }

    public UserResponse updateUserRole(Long userId, String roleName, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

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
