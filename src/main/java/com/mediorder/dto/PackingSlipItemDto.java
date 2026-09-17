package com.mediorder.dto;

import java.time.LocalDate;

public class PackingSlipItemDto {

    private String medicineName;
    private String dosage;
    private int quantity;
    private String batchNumber;
    private LocalDate expiryDate;
    private String shelfLocation;

    public PackingSlipItemDto() {
    }

    public PackingSlipItemDto(String medicineName, String dosage, int quantity, String batchNumber, LocalDate expiryDate, String shelfLocation) {
        this.medicineName = medicineName;
        this.dosage = dosage;
        this.quantity = quantity;
        this.batchNumber = batchNumber;
        this.expiryDate = expiryDate;
        this.shelfLocation = shelfLocation;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getShelfLocation() {
        return shelfLocation;
    }

    public void setShelfLocation(String shelfLocation) {
        this.shelfLocation = shelfLocation;
    }
}
