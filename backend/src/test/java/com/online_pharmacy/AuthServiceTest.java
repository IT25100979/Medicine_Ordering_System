package com.online_pharmacy;

import com.mediorder.model.Role;
import com.mediorder.model.User;
import com.online_pharmacy.config.JwtTokenProvider;
import com.online_pharmacy.dto.AuthRequest;
import com.online_pharmacy.dto.AuthResponse;
import com.online_pharmacy.repository.UserRepository;
import com.online_pharmacy.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private Authentication authentication;

    private User customerUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        customerUser = User.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("John Customer")
                .role(Role.CUSTOMER)
                .phoneNumber("0771234567")
                .build();

        adminUser = User.builder()
                .id(2L)
                .email("admin@example.com")
                .fullName("Jane Admin")
                .role(Role.ADMIN)
                .phoneNumber("0777654321")
                .build();
    }

    @Test
    void testUserLogin_Success_WhenCustomer() {
        AuthRequest request = new AuthRequest("user@example.com", "password123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("user@example.com"))
                .thenReturn(Optional.of(customerUser));
        when(tokenProvider.generateToken(authentication))
                .thenReturn("mock-jwt-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals(Role.CUSTOMER, response.getUser().getRole());
    }

    @Test
    void testUserLogin_ThrowsAccessDenied_WhenUserIsAdmin() {
        AuthRequest request = new AuthRequest("admin@example.com", "password123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(adminUser));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            authService.login(request);
        });

        assertTrue(ex.getMessage().contains("Administrator accounts must log in via the Admin Portal"));
        verify(tokenProvider, never()).generateToken(any());
    }

    @Test
    void testAdminLogin_Success_WhenAdmin() {
        AuthRequest request = new AuthRequest("admin@example.com", "adminpass123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(adminUser));
        when(tokenProvider.generateToken(authentication))
                .thenReturn("mock-admin-token");

        AuthResponse response = authService.adminLogin(request);

        assertNotNull(response);
        assertEquals("mock-admin-token", response.getToken());
        assertEquals(Role.ADMIN, response.getUser().getRole());
    }

    @Test
    void testAdminLogin_ThrowsAccessDenied_WhenUserIsCustomer() {
        AuthRequest request = new AuthRequest("user@example.com", "password123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("user@example.com"))
                .thenReturn(Optional.of(customerUser));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            authService.adminLogin(request);
        });

        assertTrue(ex.getMessage().contains("Customer accounts cannot log in through the Admin Portal"));
        verify(tokenProvider, never()).generateToken(any());
    }
}
