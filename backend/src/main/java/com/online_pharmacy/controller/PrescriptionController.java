package com.mediorder.controller;

import com.mediorder.model.Prescription;
import com.mediorder.service.PrescriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/prescriptions")
@CrossOrigin(origins = "*")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(
            PrescriptionService prescriptionService) {

        this.prescriptionService = prescriptionService;
    }

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadPrescription(
            @RequestParam("file") MultipartFile file,
            @RequestParam("doctorName") String doctorName,
            @RequestParam("customerId") Long customerId) {

        try {

            Prescription prescription =
                    prescriptionService.uploadPrescription(
                            file,
                            doctorName,
                            customerId
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(prescription);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());

        } catch (IOException e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Could not store prescription file.");
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Prescription>> getPendingPrescriptions() {

        return ResponseEntity.ok(
                prescriptionService.getPendingPrescriptions()
        );
    }
}