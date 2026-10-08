package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.dto.*;
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

    @Test
    void testCreateAdminUser() {
        when(userRepository.existsByEmail("newadmin@mediorder.com")).thenReturn(false);
        when(passwordEncoder.encode("InitialPass123!")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(200L);
            return u;
        });

        AdminUserCreateRequest req = new AdminUserCreateRequest(
                "New Admin User", "newadmin@mediorder.com", "InitialPass123!",
                Role.SYSTEM_ADMIN, UserStatus.ACTIVE, "0771122334", null
        );

        UserResponse res = userService.createUser(req, "superadmin@mediorder.com");

        assertNotNull(res);
        assertEquals("newadmin@mediorder.com", res.getEmail());
        assertEquals(Role.SYSTEM_ADMIN, res.getRole());
        verify(auditService, times(1)).logUserAction(eq("superadmin@mediorder.com"), eq("SYSTEM_ADMIN"), eq("CREATE_USER_PROFILE"), eq("User"), eq("200"), any());
    }

    @Test
    void testDeleteUser() {
        when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));

        userService.deleteUser(100L, "superadmin@mediorder.com");

        verify(userRepository, times(1)).delete(sampleUser);
        verify(auditService, times(1)).logUserAction(eq("superadmin@mediorder.com"), eq("SYSTEM_ADMIN"), eq("DELETE_USER_PROFILE"), eq("User"), eq("100"), any());
    }
}
