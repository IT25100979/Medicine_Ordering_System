package com.mediorder;

import com.mediorder.dto.PrescriptionResponse;
import com.mediorder.dto.PrescriptionVerificationRequest;
import com.mediorder.model.Prescription;
import com.mediorder.model.PrescriptionStatus;
import com.mediorder.model.Role;
import com.mediorder.model.User;
import com.mediorder.repository.PrescriptionRepository;
import com.mediorder.service.FileStorageService;
import com.mediorder.service.PrescriptionCleanupService;
import com.mediorder.service.PrescriptionService;
import com.online_pharmacy.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PrescriptionServiceTest {

    @InjectMocks
    private PrescriptionService prescriptionService;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    private User customer;
    private User pharmacist;

    @BeforeEach
    void setUp() {
        customer = User.builder()
                .id(1L)
                .email("customer@example.com")
                .fullName("John Doe")
                .role(Role.CUSTOMER)
                .build();

        pharmacist = User.builder()
                .id(2L)
                .email("pharmacist@example.com")
                .fullName("Dr. Sarah Smith")
                .role(Role.PHARMACIST)
                .build();
    }

    @Test
    void testUploadPrescriptionWithChronicSubscriptionTrue() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "script.pdf", "application/pdf", "dummy pdf content".getBytes()
        );

        when(authentication.getName()).thenReturn("customer@example.com");
        when(userRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(customer));
        when(fileStorageService.storeFile(file)).thenReturn("uuid_script.pdf");
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(invocation -> {
            Prescription p = invocation.getArgument(0);
            p.setId(100L);
            return p;
        });

        PrescriptionResponse response = prescriptionService.uploadPrescription(
                file, "Dr. Adams", "Daily medication", true, authentication
        );

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertTrue(response.getChronicSubscription());
        assertEquals(PrescriptionStatus.PENDING, response.getStatus());
        assertEquals("Dr. Adams", response.getDoctorName());
        verify(fileStorageService, times(1)).storeFile(file);
        verify(prescriptionRepository, times(1)).save(any(Prescription.class));
    }

    @Test
    void testVerifyPrescriptionRejectedPreservesChronicSubscription() {
        Prescription chronicRx = Prescription.builder()
                .id(200L)
                .customer(customer)
                .storedFileName("uuid_chronic.pdf")
                .chronicSubscription(true)
                .status(PrescriptionStatus.PENDING)
                .build();

        when(authentication.getName()).thenReturn("pharmacist@example.com");
        when(userRepository.findByEmail("pharmacist@example.com")).thenReturn(Optional.of(pharmacist));
        when(prescriptionRepository.findById(200L)).thenReturn(Optional.of(chronicRx));
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(i -> i.getArgument(0));

        PrescriptionVerificationRequest request = PrescriptionVerificationRequest.builder()
                .status(PrescriptionStatus.REJECTED)
                .rejectionReason("Doctor signature missing")
                .verificationNotes("Please upload a signed copy")
                .deleteFileImmediately(true) // User requested delete, but it's CHRONIC!
                .build();

        PrescriptionResponse response = prescriptionService.verifyPrescription(200L, request, authentication);

        assertEquals(PrescriptionStatus.REJECTED, response.getStatus());
        // Physical file must NOT be deleted because chronicSubscription is TRUE!
        verify(fileStorageService, never()).deleteFile(anyString());
        assertFalse(response.getIsFileDeleted());
    }

    @Test
    void testVerifyPrescriptionRejectedDeletesNonChronicFileWhenRequested() {
        Prescription regularRx = Prescription.builder()
                .id(300L)
                .customer(customer)
                .storedFileName("uuid_regular.jpg")
                .chronicSubscription(false)
                .status(PrescriptionStatus.PENDING)
                .build();

        when(authentication.getName()).thenReturn("pharmacist@example.com");
        when(userRepository.findByEmail("pharmacist@example.com")).thenReturn(Optional.of(pharmacist));
        when(prescriptionRepository.findById(300L)).thenReturn(Optional.of(regularRx));
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(i -> i.getArgument(0));

        PrescriptionVerificationRequest request = PrescriptionVerificationRequest.builder()
                .status(PrescriptionStatus.REJECTED)
                .rejectionReason("Expired prescription")
                .verificationNotes("Prescription is older than 12 months")
                .deleteFileImmediately(true) // Should delete non-chronic file
                .build();

        PrescriptionResponse response = prescriptionService.verifyPrescription(300L, request, authentication);

        assertEquals(PrescriptionStatus.REJECTED, response.getStatus());
        assertTrue(response.getIsFileDeleted());
        verify(fileStorageService, times(1)).deleteFile("uuid_regular.jpg");
    }

    @Test
    void testDeletePrescriptionRemovesFileAndRecord() {
        Prescription pendingRx = Prescription.builder()
                .id(400L)
                .customer(customer)
                .storedFileName("uuid_cancel.png")
                .status(PrescriptionStatus.PENDING)
                .build();

        when(authentication.getName()).thenReturn("customer@example.com");
        when(userRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(customer));
        when(prescriptionRepository.findById(400L)).thenReturn(Optional.of(pendingRx));

        prescriptionService.deletePrescription(400L, authentication);

        verify(fileStorageService, times(1)).deleteFile("uuid_cancel.png");
        verify(prescriptionRepository, times(1)).delete(pendingRx);
    }
}
