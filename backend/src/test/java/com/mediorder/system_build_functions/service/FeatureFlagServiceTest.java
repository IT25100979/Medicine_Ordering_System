package com.mediorder.system_build_functions.service;

import com.mediorder.system_build_functions.model.FeatureFlag;
import com.mediorder.system_build_functions.repository.FeatureFlagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeatureFlagServiceTest {

    @Mock
    private FeatureFlagRepository featureFlagRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private FeatureFlagService featureFlagService;

    private FeatureFlag enabledFlag;
    private FeatureFlag disabledFlag;

    @BeforeEach
    void setUp() {
        enabledFlag = FeatureFlag.builder()
                .id(1L)
                .flagKey("ORDERING")
                .enabled(true)
                .scope("GLOBAL")
                .reason("Normal operation")
                .build();

        disabledFlag = FeatureFlag.builder()
                .id(2L)
                .flagKey("DELIVERY")
                .enabled(false)
                .scope("GLOBAL")
                .reason("Severe weather pause")
                .build();
    }

    @Test
    void testIsFeatureEnabled_WhenEnabled() {
        when(featureFlagRepository.findByFlagKey("ORDERING")).thenReturn(Optional.of(enabledFlag));
        assertTrue(featureFlagService.isFeatureEnabled("ORDERING"));
    }

    @Test
    void testIsFeatureEnabled_WhenDisabled() {
        when(featureFlagRepository.findByFlagKey("DELIVERY")).thenReturn(Optional.of(disabledFlag));
        assertFalse(featureFlagService.isFeatureEnabled("DELIVERY"));
    }

    @Test
    void testAssertFeatureEnabled_ThrowsWhenDisabled() {
        when(featureFlagRepository.findByFlagKey("DELIVERY")).thenReturn(Optional.of(disabledFlag));
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                featureFlagService.assertFeatureEnabled("DELIVERY", "Delivery Dispatch"));

        assertTrue(ex.getMessage().contains("Severe weather pause"));
    }

    @Test
    void testSetFlag_UpdatesAndLogsAudit() {
        when(featureFlagRepository.findByFlagKey("ORDERING")).thenReturn(Optional.of(enabledFlag));
        when(featureFlagRepository.save(any(FeatureFlag.class))).thenReturn(enabledFlag);

        FeatureFlag updated = featureFlagService.setFlag("ORDERING", false, "GLOBAL", null, "Emergency maintenance", "admin@mediorder.com", null);

        assertNotNull(updated);
        verify(auditService, times(1)).log(isNull(), eq("admin@mediorder.com"), eq("ADMIN"), eq("TOGGLE_KILL_SWITCH"), eq("FeatureFlag"), eq("ORDERING"), any(), any(), isNull());
    }
}
