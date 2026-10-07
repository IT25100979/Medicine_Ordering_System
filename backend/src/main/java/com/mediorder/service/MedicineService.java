package com.mediorder.service;

import com.mediorder.model.Medicine;
import com.mediorder.repository.MedicineRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired(required = false)
    private com.mediorder.repository.InventoryBatchRepository batchRepository;

    @PostConstruct
    public void seedInitialCatalogIfEmpty() {
        if (medicineRepository.count() == 0) {
            List<Medicine> initialCatalog = Arrays.asList(
                    Medicine.builder()
                            .name("Vitamin C 1000mg Bioflavonoid")
                            .genericName("Ascorbic Acid & Bioflavonoid Complex")
                            .sku("SKU-VIT-1092")
                            .requiresPrescription(false)
                            .isTemperatureSensitive(false)
                            .unitPrice(new BigDecimal("30.50"))
                            .category("Dietary & Vits")
                            .stockQuantity(420)
                            .msrp(new BigDecimal("36.00"))
                            .cogs(new BigDecimal("17.02"))
                            .description("High-absorption ascorbic acid paired with pure wild rose hips and citrus bioflavonoid complex formulated for sustained cellular defense.")
                            .imageUrl("https://lh3.googleusercontent.com/aida-public/AB6AXuCJDdVfCIjMPAceT_mPyIaw2J3QGOB9oVsJ1V_huFsmPJQuMxH0XuqgNAVW0oDGkEpKzN9bzKDe5YlH8zkdfGH5E_Bl0QWb3pRQOVOQ2efCnKqR7KcabZd0UqUxj2WWLH-DLAnrogqf69opvl7ezDXW7aAV8EmTFnhQjhemjfrmZfUtI1maYFC6IXWu8cqHYuVlacD7orqh-WNgG4mzL1qwuoiqDJTWsIDHJl8SxV91zcB_uYvJq0y5")
                            .rating(new BigDecimal("4.8"))
                            .reviewsCount(142)
                            .createdAt(LocalDateTime.now())
                            .build(),
                    Medicine.builder()
                            .name("Clinical Retinoid 0.05% Solution")
                            .genericName("Pure Micro-Encapsulated Retinol")
                            .sku("SKU-DERM-4011")
                            .requiresPrescription(false)
                            .isTemperatureSensitive(false)
                            .unitPrice(new BigDecimal("54.00"))
                            .category("Dermatology")
                            .stockQuantity(8)
                            .msrp(new BigDecimal("62.00"))
                            .cogs(new BigDecimal("24.50"))
                            .description("Pharmaceutical-grade stabilized retinoid suspended in botanical squalane. Accelerates epidermal turnover while minimizing transepidermal water loss.")
                            .imageUrl("https://lh3.googleusercontent.com/aida-public/AB6AXuAxLcY1zBGmCKQhX5yXcWVhGZbsfoMbAWaWU4Nftaw42TfyMtFnl03t1_ayFOmafhKZHFVwDR82N6QJz72DkQOZDj1NHfgJBRhKAQeAEJZBygQSfYyR29HmRH9JwuFnJNriSoqciS_7R48NKHBxlXX4lxeu8ZsQDjcv8t1nGp-J4XZpYUT5ZTv9ceAl5KaZXe5JN6NwBpmKvnPvB08i8BFkcZx5U8-UsX9z5ffWLC51WZ14Gdp8sfRt")
                            .rating(new BigDecimal("4.9"))
                            .reviewsCount(98)
                            .createdAt(LocalDateTime.now())
                            .build()
            );

            medicineRepository.saveAll(initialCatalog);
            System.out.println("[MedicineService] Initialized pharmaceutical catalog with initial medications.");
        }
    }

    @Transactional(readOnly = true)
    public List<Medicine> getAllMedicines(String query, String category, Boolean requiresPrescription) {
        List<Medicine> list = medicineRepository.findAllByOrderByNameAsc();

        if (query != null && !query.trim().isEmpty()) {
            String q = query.trim().toLowerCase();
            list = list.stream().filter(m -> 
                (m.getName() != null && m.getName().toLowerCase().contains(q)) ||
                (m.getGenericName() != null && m.getGenericName().toLowerCase().contains(q)) ||
                (m.getSku() != null && m.getSku().toLowerCase().contains(q))
            ).toList();
        }

        if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("all") && !category.equalsIgnoreCase("all items")) {
            String cat = category.trim().toLowerCase();
            list = list.stream().filter(m -> m.getCategory() != null && m.getCategory().toLowerCase().contains(cat)).toList();
        }

        if (requiresPrescription != null) {
            list = list.stream().filter(m -> Objects.equals(m.getRequiresPrescription(), requiresPrescription)).toList();
        }

        return list;
    }

    @Transactional(readOnly = true)
    public Medicine getMedicineById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));
    }

    public Medicine createMedicine(Medicine medicine) {
        if (medicine.getSku() == null || medicine.getSku().trim().isEmpty()) {
            medicine.setSku("SKU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        if (medicineRepository.existsBySku(medicine.getSku().trim())) {
            throw new IllegalArgumentException("A medicine with SKU " + medicine.getSku() + " already exists.");
        }
        if (medicine.getUnitPrice() == null) {
            medicine.setUnitPrice(medicine.getPrice() != null ? medicine.getPrice() : BigDecimal.ZERO);
        }
        if (medicine.getCategory() == null || medicine.getCategory().trim().isEmpty()) {
            medicine.setCategory("Dietary & Vits");
        }
        medicine.setStockQuantity(0);
        medicine.setCreatedAt(LocalDateTime.now());
        return medicineRepository.save(medicine);
    }

    public Medicine updateMedicine(Long id, Medicine details) {
        Medicine existing = getMedicineById(id);

        if (details.getName() != null) existing.setName(details.getName().trim());
        if (details.getGenericName() != null) existing.setGenericName(details.getGenericName().trim());
        if (details.getUnitPrice() != null) existing.setUnitPrice(details.getUnitPrice());
        else if (details.getPrice() != null) existing.setUnitPrice(details.getPrice());
        if (details.getCategory() != null) existing.setCategory(details.getCategory().trim());
        if (details.getStockQuantity() != null) existing.setStockQuantity(details.getStockQuantity());
        if (details.getMsrp() != null) existing.setMsrp(details.getMsrp());
        if (details.getCogs() != null) existing.setCogs(details.getCogs());
        if (details.getDescription() != null) existing.setDescription(details.getDescription());
        if (details.getImageUrl() != null) existing.setImageUrl(details.getImageUrl());
        if (details.getRequiresPrescription() != null) existing.setRequiresPrescription(details.getRequiresPrescription());
        if (details.getIsTemperatureSensitive() != null) existing.setIsTemperatureSensitive(details.getIsTemperatureSensitive());
        if (details.getMinTemp() != null) existing.setMinTemp(details.getMinTemp());
        if (details.getMaxTemp() != null) existing.setMaxTemp(details.getMaxTemp());
        if (details.getRating() != null) existing.setRating(details.getRating());
        if (details.getReviewsCount() != null) existing.setReviewsCount(details.getReviewsCount());

        return medicineRepository.save(existing);
    }

    public void deleteMedicine(Long id) {
        Medicine existing = getMedicineById(id);
        if (batchRepository != null) {
            List<com.mediorder.model.InventoryBatch> batches = batchRepository.findByMedicineIdOrderByExpiryDateAsc(id);
            if (batches != null && !batches.isEmpty()) {
                batchRepository.deleteAll(batches);
            }
        }
        medicineRepository.delete(existing);
    }

    public int batchPriceUpdate(BigDecimal percentageChange, String category) {
        List<Medicine> targets;
        if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("all")) {
            targets = medicineRepository.findByCategoryIgnoreCase(category.trim());
        } else {
            targets = medicineRepository.findAll();
        }

        BigDecimal multiplier = BigDecimal.ONE.add(percentageChange.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        for (Medicine m : targets) {
            if (m.getUnitPrice() != null) {
                BigDecimal newPrice = m.getUnitPrice().multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
                m.setUnitPrice(newPrice);
            }
        }
        medicineRepository.saveAll(targets);
        return targets.size();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCatalogStats() {
        List<Medicine> all = medicineRepository.findAll();
        long totalSkus = all.size();
        long lowStockCount = all.stream().filter(m -> m.getStockQuantity() != null && m.getStockQuantity() <= 15).count();

        BigDecimal totalPrice = BigDecimal.ZERO;
        int priceCount = 0;
        for (Medicine m : all) {
            if (m.getUnitPrice() != null) {
                totalPrice = totalPrice.add(m.getUnitPrice());
                priceCount++;
            }
        }
        BigDecimal avgPrice = priceCount > 0 ? totalPrice.divide(new BigDecimal(priceCount), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalActiveSkus", totalSkus);
        stats.put("lowStockCount", lowStockCount);
        stats.put("avgSellingPrice", avgPrice);
        stats.put("pendingReviewsCount", 12);
        stats.put("shelfFulfillmentRate", "98.2%");
        stats.put("blendedGrossMargin", "47.0%");

        return stats;
    }
}
