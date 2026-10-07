package com.mediorder.it25102867_batchandstock_management.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class StockAdjustRequest {
    private Integer stockQuantity;
    private Integer allocatedStock;
    private Integer reorderLevel;
    private String shelfLocation;
    private BigDecimal cogs;
    private BigDecimal unitPrice;
    private String batchNumber;
    private String barcode;
    private String storageRequirement;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;

    public StockAdjustRequest() {}

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public Integer getAllocatedStock() { return allocatedStock; }
    public void setAllocatedStock(Integer allocatedStock) { this.allocatedStock = allocatedStock; }

    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }

    public String getShelfLocation() { return shelfLocation; }
    public void setShelfLocation(String shelfLocation) { this.shelfLocation = shelfLocation; }

    public BigDecimal getCogs() { return cogs; }
    public void setCogs(BigDecimal cogs) { this.cogs = cogs; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getStorageRequirement() { return storageRequirement; }
    public void setStorageRequirement(String storageRequirement) { this.storageRequirement = storageRequirement; }

    public LocalDate getManufacturingDate() { return manufacturingDate; }
    public void setManufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
}
