package com.mediorder.service;
import com.online_pharmacy.model.User;
import com.online_pharmacy.repository.UserRepository;

import com.mediorder.model.Prescription;
import com.mediorder.model.PrescriptionStatus;
import com.mediorder.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final FileHashService fileHashService;

    public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService,
            FileHashService fileHashService) {

        this.prescriptionRepository = prescriptionRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.fileHashService = fileHashService;
    }

    public Prescription uploadPrescription(
            MultipartFile file,
            String doctorName,
            Long customerId) throws IOException {

        validateFile(file);

        User customer = userRepository.findById(customerId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Customer not found."
                        )
                );

        String fileHash = fileHashService.generateSha256(file);

        if (prescriptionRepository.existsByFileHash(fileHash)) {
            throw new IllegalArgumentException(
                    "This prescription file has already been uploaded."
            );
        }

        String filePath = fileStorageService.storeFile(file);

        Prescription prescription = Prescription.builder()
                .customer(customer)
                .prescriptionIdentifier("PR-" + System.currentTimeMillis())
                .fileUrl(filePath)
                .fileHash(fileHash)
                .version(1)
                .doctorName(doctorName)
                .status(PrescriptionStatus.PENDING)
                .build();

        return prescriptionRepository.save(prescription);
    }

    public List<Prescription> getPendingPrescriptions() {

        return prescriptionRepository
                .findByStatusOrderByCreatedAtAsc(
                        PrescriptionStatus.PENDING
                );
    }

    private void validateFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Prescription file is required."
            );
        }

        String contentType = file.getContentType();

        boolean validType =
                "application/pdf".equalsIgnoreCase(contentType)
                        || "image/jpeg".equalsIgnoreCase(contentType)
                        || "image/jpg".equalsIgnoreCase(contentType);

        if (!validType) {
            throw new IllegalArgumentException(
                    "Only PDF and JPEG prescription files are allowed."
            );
        }

        long maxSize = 10 * 1024 * 1024;

        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(
                    "Prescription file must not exceed 10 MB."
            );
        }
    }
}