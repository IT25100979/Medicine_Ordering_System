package com.mediorder.controller;

import com.mediorder.model.Medicine;
import com.mediorder.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/medicines", "/api/medicines"})
@CrossOrigin(origins = "*")
public class MedicineController {

    @Autowired
    private MedicineService medicineService;

    @GetMapping
    public ResponseEntity<List<Medicine>> getAllMedicines(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "requiresPrescription", required = false) Boolean requiresPrescription) {
        return ResponseEntity.ok(medicineService.getAllMedicines(search, requiresPrescription));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Medicine> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.getMedicineById(id));
    }
}
