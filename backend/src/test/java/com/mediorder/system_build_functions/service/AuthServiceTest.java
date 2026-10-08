package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.config.JwtTokenProvider;
import com.mediorder.system_build_functions.dto.AuthRequest;
import com.mediorder.system_build_functions.dto.AuthResponse;
import com.mediorder.system_build_functions.dto.DemoLoginRequest;
import com.mediorder.system_build_functions.repository.UserRepository;
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

    @Test
    void testAdminLogin_Success_WhenOperationsManager() {
        User opsUser = User.builder()
                .id(3L)
                .email("ops@example.com")
                .fullName("Ops Lead")
                .role(Role.OPERATIONS_MANAGER)
                .phoneNumber("0773333333")
                .build();
        AuthRequest request = new AuthRequest("ops@example.com", "adminpass123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("ops@example.com"))
                .thenReturn(Optional.of(opsUser));
        when(tokenProvider.generateToken(authentication))
                .thenReturn("mock-ops-token");

        AuthResponse response = authService.adminLogin(request);

        assertNotNull(response);
        assertEquals("mock-ops-token", response.getToken());
        assertEquals(Role.OPERATIONS_MANAGER, response.getUser().getRole());
    }

    @Test
    void testAdminLogin_Success_WhenFinanceManager() {
        User finUser = User.builder()
                .id(4L)
                .email("finance@example.com")
                .fullName("Finance Chief")
                .role(Role.FINANCE_MANAGER)
                .phoneNumber("0774444444")
                .build();
        AuthRequest request = new AuthRequest("finance@example.com", "adminpass123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("finance@example.com"))
                .thenReturn(Optional.of(finUser));
        when(tokenProvider.generateToken(authentication))
                .thenReturn("mock-fin-token");

        AuthResponse response = authService.adminLogin(request);

        assertNotNull(response);
        assertEquals("mock-fin-token", response.getToken());
        assertEquals(Role.FINANCE_MANAGER, response.getUser().getRole());
    }

    @Test
    void testUserLogin_ThrowsAccessDenied_WhenFinanceManager() {
        User finUser = User.builder()
                .id(4L)
                .email("finance@example.com")
                .fullName("Finance Chief")
                .role(Role.FINANCE_MANAGER)
                .phoneNumber("0774444444")
                .build();
        AuthRequest request = new AuthRequest("finance@example.com", "adminpass123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("finance@example.com"))
                .thenReturn(Optional.of(finUser));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            authService.login(request);
        });

        assertTrue(ex.getMessage().contains("Administrator accounts must log in via the Admin Portal"));
        verify(tokenProvider, never()).generateToken(any());
    }

    @Test
    void testDemoLogin_ChiefPharmacist_ReturnsValidTokenAndRole() {
        User pharmUser = User.builder()
                .id(10L)
                .email("pharmacist@mediorder.com")
                .fullName("Dr. Silva")
                .role(Role.CHIEF_PHARMACIST)
                .isDemo(true)
                .build();

        when(userRepository.findByEmail("pharmacist@mediorder.com")).thenReturn(Optional.of(pharmUser));
        when(tokenProvider.generateTokenFromUsername("pharmacist@mediorder.com")).thenReturn("mock-pharm-token");

        AuthResponse response = authService.demoLogin(new DemoLoginRequest("CHIEF_PHARMACIST"));

        assertNotNull(response);
        assertEquals("mock-pharm-token", response.getToken());
        assertEquals(Role.CHIEF_PHARMACIST, response.getUser().getRole());
        assertTrue(response.getUser().getIsDemo());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testDemoLogin_Customer_SeedsIfMissing() {
        when(userRepository.findByEmail("customer@mediorder.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(101L);
            return u;
        });
        when(tokenProvider.generateTokenFromUsername("customer@mediorder.com")).thenReturn("mock-cust-token");

        AuthResponse response = authService.demoLogin(new DemoLoginRequest("CUSTOMER"));

        assertNotNull(response);
        assertEquals("mock-cust-token", response.getToken());
        assertEquals(Role.CUSTOMER, response.getUser().getRole());
    }
}
