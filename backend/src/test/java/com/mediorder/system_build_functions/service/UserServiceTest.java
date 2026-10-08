package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.dto.PasswordChangeRequest;
import com.mediorder.system_build_functions.dto.ProfileUpdateRequest;
import com.mediorder.system_build_functions.dto.UserResponse;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.model.UserStatus;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(100L)
                .email("testuser@mediorder.com")
                .fullName("John Doe")
                .phoneNumber("0771234567")
                .passwordHash("hashedpass")
                .role(Role.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .isDemo(false)
                .build();
    }

    @Test
    void testGetProfile() {
        when(userRepository.findByEmail("testuser@mediorder.com")).thenReturn(Optional.of(sampleUser));

        UserResponse res = userService.getProfile("testuser@mediorder.com");
        assertNotNull(res);
        assertEquals("John Doe", res.getFullName());
        assertEquals("testuser@mediorder.com", res.getEmail());
    }

    @Test
    void testUpdateProfile() {
        when(userRepository.findByEmail("testuser@mediorder.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        ProfileUpdateRequest req = new ProfileUpdateRequest("Jane Doe", "0779998888", "https://img.com/avatar.jpg");
        UserResponse updated = userService.updateProfile("testuser@mediorder.com", req);

        assertEquals("Jane Doe", updated.getFullName());
        assertEquals("0779998888", updated.getContactNumber());
        verify(auditService, times(1)).logUserAction(eq("testuser@mediorder.com"), any(), eq("PROFILE_UPDATED"), eq("User"), eq("100"), any());
    }

    @Test
    void testChangePassword() {
        when(userRepository.findByEmail("testuser@mediorder.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("OldPass123", "hashedpass")).thenReturn(true);
        when(passwordEncoder.encode("NewPass123")).thenReturn("newHashedPass");

        PasswordChangeRequest req = new PasswordChangeRequest("OldPass123", "NewPass123");
        userService.changePassword("testuser@mediorder.com", req);

        assertEquals("newHashedPass", sampleUser.getPasswordHash());
        verify(userRepository, times(1)).save(sampleUser);
    }
}
