package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.config.JwtTokenProvider;
import com.mediorder.system_build_functions.dto.*;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.model.UserStatus;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    /** Mirrors ENABLE_DEMO_LOGIN; when false the demo endpoint behaves as if it does not exist. */
    @Value("${app.demo-login.enabled:true}")
    private boolean demoLoginEnabled = true;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email is already registered: " + normalizedEmail);
        }

        Role userRole = request.getRole() != null ? request.getRole() : Role.CUSTOMER;
        if (userRole == Role.SYSTEM_ADMIN || userRole == Role.ADMIN) {
            // System administrators are created only via seed data / the admin console.
            throw new AccessDeniedException("System Admin accounts cannot be self-registered.");
        }
        UserStatus status = userRole.isAdminRole() ? UserStatus.PENDING_APPROVAL : UserStatus.ACTIVE;

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getContactNumber().trim())
                .role(userRole)
                .status(status)
                .isDemo(false)
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        // Staff accounts must be approved before they can act, so no session token is issued yet.
        if (savedUser.getStatus() != UserStatus.ACTIVE) {
            return AuthResponse.builder()
                    .tokenType("Bearer")
                    .message("Registration received. Your staff account is pending System Admin approval.")
                    .user(mapToUserResponse(savedUser))
                    .build();
        }

        String token = tokenProvider.generateTokenFromUsername(savedUser.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .message("User registered successfully")
                .user(mapToUserResponse(savedUser))
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().trim().toLowerCase(),
                            request.getPassword()
                    )
            );

            User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            if (user.getRole() != null && user.getRole().isAdminRole()) {
                throw new AccessDeniedException("Access denied: Administrator accounts must log in via the Admin Portal.");
            }

            if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
                throw new AccessDeniedException("Your account is pending administrator approval.");
            } else if (user.getStatus() == UserStatus.SUSPENDED) {
                throw new AccessDeniedException("Your account has been suspended.");
            }

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String token = tokenProvider.generateToken(authentication);

            return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .message("Login successful")
                .user(mapToUserResponse(user))
                .build();
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Invalid email or password");
        } catch (DisabledException ex) {
            throw new AccessDeniedException("Your account is pending administrator approval.");
        } catch (LockedException ex) {
            throw new AccessDeniedException("Your account has been suspended.");
        }
    }

    public AuthResponse adminLogin(AuthRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().trim().toLowerCase(),
                            request.getPassword()
                    )
            );

            User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            if (user.getRole() == null || !user.getRole().isAdminRole()) {
                throw new AccessDeniedException("Access denied: Customer accounts cannot log in through the Admin Portal.");
            }

            if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
                throw new AccessDeniedException("Admin account is pending IT / System Admin approval.");
            } else if (user.getStatus() == UserStatus.SUSPENDED) {
                throw new AccessDeniedException("Admin account has been suspended.");
            }

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String token = tokenProvider.generateToken(authentication);

            return AuthResponse.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .message("Admin login successful")
                    .user(mapToUserResponse(user))
                    .build();
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Invalid email or password");
        } catch (DisabledException ex) {
            throw new AccessDeniedException("Admin account is pending IT / System Admin approval.");
        } catch (LockedException ex) {
            throw new AccessDeniedException("Admin account has been suspended.");
        }
    }

    /**
     * 1-Click Demo Login for any of the 8 canonical roles.
     * Guaranteed instant access for QA, testing, and assessment grading.
     */
    @Transactional
    public AuthResponse demoLogin(DemoLoginRequest request) {
        if (!demoLoginEnabled) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        String roleStr = request.getRole() != null ? request.getRole().trim().toUpperCase() : "CUSTOMER";
        
        Role targetRole;
        String email;
        String defaultName;
        String defaultPhone;

        switch (roleStr) {
            case "CHIEF_PHARMACIST":
            case "PHARMACIST":
                targetRole = Role.CHIEF_PHARMACIST;
                email = "pharmacist1@gmail.com";
                defaultName = "pharmacist1";
                defaultPhone = "555-010-0004";
                break;
            case "OPERATIONS_MANAGER":
            case "OPS":
                targetRole = Role.OPERATIONS_MANAGER;
                email = "operationsmanager1@gmail.com";
                defaultName = "operationsmanager1";
                defaultPhone = "555-010-0003";
                break;
            case "DELIVERY_COORDINATOR":
            case "COORDINATOR":
            case "DELIVERY_RIDER":
            case "RIDER":
            case "COURIER":
                targetRole = Role.DELIVERY_COORDINATOR;
                email = "deliverycoordinator1@gmail.com";
                defaultName = "deliverycoordinator1";
                defaultPhone = "555-010-0005";
                break;
            case "SYSTEM_ADMIN":
            case "ADMIN":
            case "IT_MANAGER":
            case "FINANCE_MANAGER":
                targetRole = Role.SYSTEM_ADMIN;
                email = "systemadmin1@gmail.com";
                defaultName = "systemadmin1";
                defaultPhone = "555-010-0002";
                break;
            case "CUSTOMER":
            default:
                targetRole = Role.CUSTOMER;
                email = "customer1@gmail.com";
                defaultName = "customer1";
                defaultPhone = "555-010-0001";
                break;
        }

        Role finalRole = targetRole;
        String finalName = defaultName;
        String finalPhone = defaultPhone;

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .fullName(finalName)
                    .email(email)
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .phoneNumber(finalPhone)
                    .role(finalRole)
                    .status(UserStatus.ACTIVE)
                    .isDemo(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            return userRepository.save(newUser);
        });

        // Ensure user is active and has correct role & demo flag
        user.setStatus(UserStatus.ACTIVE);
        user.setIsDemo(true);
        user.setRole(targetRole);
        userRepository.save(user);

        String token = tokenProvider.generateTokenFromUsername(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .message("Demo login successful as " + targetRole.name())
                .user(mapToUserResponse(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        return mapToUserResponse(user);
    }

    public UserResponse mapToUserResponse(User user) {
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
