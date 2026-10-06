package com.mediorder.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicines")
public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "generic_name")
    private String genericName;

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(name = "requires_prescription", nullable = false)
    private Boolean requiresPrescription = false;

    @Column(name = "is_temperature_sensitive", nullable = false)
    private Boolean isTemperatureSensitive = false;

    @Column(name = "min_temp", precision = 4, scale = 2)
    private BigDecimal minTemp;

    @Column(name = "max_temp", precision = 4, scale = 2)
    private BigDecimal maxTemp;

    @JsonAlias({"price", "unit_price", "unitPrice"})
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "category")
    private String category = "General";

    @Column(name = "stock_quantity")
    private Integer stockQuantity = 100;

    @Column(name = "msrp", precision = 10, scale = 2)
    private BigDecimal msrp;

    @Column(name = "cogs", precision = 10, scale = 2)
    private BigDecimal cogs;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "rating", precision = 3, scale = 1)
    private BigDecimal rating = new BigDecimal("4.8");

    @Column(name = "reviews_count")
    private Integer reviewsCount = 50;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(name = "manufacturing_date")
    private LocalDate manufacturingDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "shelf_location", length = 100)
    private String shelfLocation = "Shelf A-01";

    @Column(name = "allocated_stock")
    private Integer allocatedStock = 0;

    @Column(name = "reorder_level")
    private Integer reorderLevel = 25;

    @Column(name = "is_quarantined")
    private Boolean isQuarantined = false;

    @Column(name = "barcode", length = 100)
    private String barcode;

    @Column(name = "storage_requirement", length = 100)
    private String storageRequirement = "Room Temperature (15°C - 25°C)";

    @Column(name = "tags", length = 255)
    private String tags;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Medicine() {}

    public Medicine(Long id, String name, String genericName, String sku,
                    Boolean requiresPrescription, Boolean isTemperatureSensitive,
                    BigDecimal minTemp, BigDecimal maxTemp, BigDecimal unitPrice,
                    String category, Integer stockQuantity, BigDecimal msrp, BigDecimal cogs,
                    String description, String imageUrl, BigDecimal rating, Integer reviewsCount,
                    LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.genericName = genericName;
        this.sku = sku;
        this.requiresPrescription = requiresPrescription != null ? requiresPrescription : false;
        this.isTemperatureSensitive = isTemperatureSensitive != null ? isTemperatureSensitive : false;
        this.minTemp = minTemp;
        this.maxTemp = maxTemp;
        this.unitPrice = unitPrice != null ? unitPrice : BigDecimal.ZERO;
        this.category = category != null ? category : "General";
        this.stockQuantity = stockQuantity != null ? stockQuantity : 100;
        this.msrp = msrp;
        this.cogs = cogs;
        this.description = description;
        this.imageUrl = imageUrl;
        this.rating = rating != null ? rating : new BigDecimal("4.8");
        this.reviewsCount = reviewsCount != null ? reviewsCount : 50;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.requiresPrescription == null) {
            this.requiresPrescription = false;
        }
        if (this.isTemperatureSensitive == null) {
            this.isTemperatureSensitive = false;
        }
        if (this.category == null) {
            this.category = "General";
        }
        if (this.stockQuantity == null) {
            this.stockQuantity = 100;
        }
        if (this.unitPrice == null) {
            this.unitPrice = BigDecimal.ZERO;
        }
        if (this.rating == null) {
            this.rating = new BigDecimal("4.8");
        }
        if (this.reviewsCount == null) {
            this.reviewsCount = 50;
        }
        if (this.allocatedStock == null) {
            this.allocatedStock = 0;
        }
        if (this.reorderLevel == null) {
            this.reorderLevel = 25;
        }
        if (this.isQuarantined == null) {
            this.isQuarantined = false;
        }
        if (this.shelfLocation == null) {
            this.shelfLocation = "Shelf A-01";
        }
        if (this.batchNumber == null && this.sku != null) {
            this.batchNumber = "LOT-" + this.sku;
        }
        if (this.manufacturingDate == null) {
            this.manufacturingDate = LocalDate.now().minusMonths(6);
        }
        if (this.expiryDate == null) {
            this.expiryDate = LocalDate.now().plusMonths(18);
        }
        if (this.barcode == null && this.sku != null) {
            this.barcode = "BC-" + this.sku.replace("SKU-", "");
        }
        if (this.storageRequirement == null) {
            this.storageRequirement = Boolean.TRUE.equals(this.isTemperatureSensitive) 
                ? "Cold Chain (2°C - 8°C)" 
                : "Room Temperature (15°C - 25°C)";
        }
        if (this.tags == null) {
            java.util.List<String> tagList = new java.util.ArrayList<>();
            if (Boolean.TRUE.equals(this.requiresPrescription)) tagList.add("Rx");
            else tagList.add("OTC");
            if (Boolean.TRUE.equals(this.isTemperatureSensitive)) tagList.add("Cold Chain");
            this.tags = String.join(", ", tagList);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public Boolean getRequiresPrescription() { return requiresPrescription; }
    public void setRequiresPrescription(Boolean requiresPrescription) { this.requiresPrescription = requiresPrescription; }

    public Boolean getIsTemperatureSensitive() { return isTemperatureSensitive; }
    public void setIsTemperatureSensitive(Boolean isTemperatureSensitive) { this.isTemperatureSensitive = isTemperatureSensitive; }

    public BigDecimal getMinTemp() { return minTemp; }
    public void setMinTemp(BigDecimal minTemp) { this.minTemp = minTemp; }

    public BigDecimal getMaxTemp() { return maxTemp; }
    public void setMaxTemp(BigDecimal maxTemp) { this.maxTemp = maxTemp; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice != null ? unitPrice : BigDecimal.ZERO; }

    public BigDecimal getPrice() { return getUnitPrice(); }
    public void setPrice(BigDecimal price) { setUnitPrice(price); }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public BigDecimal getMsrp() { return msrp; }
    public void setMsrp(BigDecimal msrp) { this.msrp = msrp; }

    public BigDecimal getCogs() { return cogs; }
    public void setCogs(BigDecimal cogs) { this.cogs = cogs; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public Integer getReviewsCount() { return reviewsCount; }
    public void setReviewsCount(Integer reviewsCount) { this.reviewsCount = reviewsCount; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public LocalDate getManufacturingDate() { return manufacturingDate; }
    public void setManufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getShelfLocation() { return shelfLocation; }
    public void setShelfLocation(String shelfLocation) { this.shelfLocation = shelfLocation; }

    public Integer getAllocatedStock() { return allocatedStock != null ? allocatedStock : 0; }
    public void setAllocatedStock(Integer allocatedStock) { this.allocatedStock = allocatedStock; }

    public Integer getReorderLevel() { return reorderLevel != null ? reorderLevel : 25; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }

    public Boolean getIsQuarantined() { return isQuarantined != null ? isQuarantined : false; }
    public void setIsQuarantined(Boolean isQuarantined) { this.isQuarantined = isQuarantined; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getStorageRequirement() { return storageRequirement != null ? storageRequirement : "Room Temperature (15°C - 25°C)"; }
    public void setStorageRequirement(String storageRequirement) { this.storageRequirement = storageRequirement; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static MedicineBuilder builder() {
        return new MedicineBuilder();
    }

    public static class MedicineBuilder {
        private Long id;
        private String name;
        private String genericName;
        private String sku;
        private Boolean requiresPrescription = false;
        private Boolean isTemperatureSensitive = false;
        private BigDecimal minTemp;
        private BigDecimal maxTemp;
        private BigDecimal unitPrice = BigDecimal.ZERO;
        private String category = "General";
        private Integer stockQuantity = 100;
        private BigDecimal msrp;
        private BigDecimal cogs;
        private String description;
        private String imageUrl;
        private BigDecimal rating = new BigDecimal("4.8");
        private Integer reviewsCount = 50;
        private String batchNumber;
        private LocalDate manufacturingDate;
        private LocalDate expiryDate;
        private String shelfLocation = "Shelf A-01";
        private Integer allocatedStock = 0;
        private Integer reorderLevel = 25;
        private Boolean isQuarantined = false;
        private String barcode;
        private String storageRequirement = "Room Temperature (15°C - 25°C)";
        private String tags;
        private LocalDateTime createdAt;

        public MedicineBuilder id(Long id) { this.id = id; return this; }
        public MedicineBuilder name(String name) { this.name = name; return this; }
        public MedicineBuilder genericName(String genericName) { this.genericName = genericName; return this; }
        public MedicineBuilder sku(String sku) { this.sku = sku; return this; }
        public MedicineBuilder requiresPrescription(Boolean requiresPrescription) { this.requiresPrescription = requiresPrescription; return this; }
        public MedicineBuilder isTemperatureSensitive(Boolean isTemperatureSensitive) { this.isTemperatureSensitive = isTemperatureSensitive; return this; }
        public MedicineBuilder minTemp(BigDecimal minTemp) { this.minTemp = minTemp; return this; }
        public MedicineBuilder maxTemp(BigDecimal maxTemp) { this.maxTemp = maxTemp; return this; }
        public MedicineBuilder unitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; return this; }
        public MedicineBuilder category(String category) { this.category = category; return this; }
        public MedicineBuilder stockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; return this; }
        public MedicineBuilder msrp(BigDecimal msrp) { this.msrp = msrp; return this; }
        public MedicineBuilder cogs(BigDecimal cogs) { this.cogs = cogs; return this; }
        public MedicineBuilder description(String description) { this.description = description; return this; }
        public MedicineBuilder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }
        public MedicineBuilder rating(BigDecimal rating) { this.rating = rating; return this; }
        public MedicineBuilder reviewsCount(Integer reviewsCount) { this.reviewsCount = reviewsCount; return this; }
        public MedicineBuilder batchNumber(String batchNumber) { this.batchNumber = batchNumber; return this; }
        public MedicineBuilder manufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; return this; }
        public MedicineBuilder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public MedicineBuilder shelfLocation(String shelfLocation) { this.shelfLocation = shelfLocation; return this; }
        public MedicineBuilder allocatedStock(Integer allocatedStock) { this.allocatedStock = allocatedStock; return this; }
        public MedicineBuilder reorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; return this; }
        public MedicineBuilder isQuarantined(Boolean isQuarantined) { this.isQuarantined = isQuarantined; return this; }
        public MedicineBuilder barcode(String barcode) { this.barcode = barcode; return this; }
        public MedicineBuilder storageRequirement(String storageRequirement) { this.storageRequirement = storageRequirement; return this; }
        public MedicineBuilder tags(String tags) { this.tags = tags; return this; }
        public MedicineBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Medicine build() {
            Medicine m = new Medicine();
            m.setId(this.id);
            m.setName(this.name);
            m.setGenericName(this.genericName);
            m.setSku(this.sku);
            m.setRequiresPrescription(this.requiresPrescription != null ? this.requiresPrescription : false);
            m.setIsTemperatureSensitive(this.isTemperatureSensitive != null ? this.isTemperatureSensitive : false);
            m.setMinTemp(this.minTemp);
            m.setMaxTemp(this.maxTemp);
            m.setUnitPrice(this.unitPrice != null ? this.unitPrice : BigDecimal.ZERO);
            m.setCategory(this.category != null ? this.category : "General");
            m.setStockQuantity(this.stockQuantity != null ? this.stockQuantity : 100);
            m.setMsrp(this.msrp);
            m.setCogs(this.cogs);
            m.setDescription(this.description);
            m.setImageUrl(this.imageUrl);
            m.setRating(this.rating != null ? this.rating : new BigDecimal("4.8"));
            m.setReviewsCount(this.reviewsCount != null ? this.reviewsCount : 50);
            m.setBatchNumber(this.batchNumber);
            m.setManufacturingDate(this.manufacturingDate);
            m.setExpiryDate(this.expiryDate);
            m.setShelfLocation(this.shelfLocation != null ? this.shelfLocation : "Shelf A-01");
            m.setAllocatedStock(this.allocatedStock != null ? this.allocatedStock : 0);
            m.setReorderLevel(this.reorderLevel != null ? this.reorderLevel : 25);
            m.setIsQuarantined(this.isQuarantined != null ? this.isQuarantined : false);
            m.setBarcode(this.barcode);
            m.setStorageRequirement(this.storageRequirement != null ? this.storageRequirement : "Room Temperature (15°C - 25°C)");
            m.setTags(this.tags);
            m.setCreatedAt(this.createdAt != null ? this.createdAt : LocalDateTime.now());
            return m;
        }
    }
}
