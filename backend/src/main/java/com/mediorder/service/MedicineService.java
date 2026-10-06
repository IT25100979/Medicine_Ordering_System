package com.mediorder.service;

import com.mediorder.model.Medicine;
import com.mediorder.repository.MedicineRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private com.online_pharmacy.repository.UserRepository userRepository;

    @Autowired
    private com.mediorder.repository.NotificationRepository notificationRepository;

    @Autowired(required = false)
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostConstruct
    public void seedInitialCatalogIfEmpty() {
        seedDailyEssentialsIfMissing();
    }

    private void seedDailyEssentialsIfMissing() {
        List<Medicine> dailyEssentials = Arrays.asList(
                Medicine.builder()
                        .name("Biotin Supplement 10,000mcg")
                        .genericName("Pure D-Biotin High Potency Complex")
                        .sku("SKU-VIT-BIO-10K")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("56.00"))
                        .category("Dietary & Vits")
                        .stockQuantity(180)
                        .msrp(new BigDecimal("64.00"))
                        .cogs(new BigDecimal("22.00"))
                        .description("High-potency clinical D-Biotin formulated to fortify keratin infrastructure, supporting hair fullness, dermal resilience, and nail plate integrity.")
                        .imageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(112)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Goji Berry Extract 500mg")
                        .genericName("Lycium Barbarum Standardized Polysaccharides")
                        .sku("SKU-VIT-GOJ-500")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("65.00"))
                        .category("Dietary & Vits")
                        .stockQuantity(140)
                        .msrp(new BigDecimal("75.00"))
                        .cogs(new BigDecimal("26.00"))
                        .description("Wild-harvested Himalayan goji berry extract rich in zeaxanthin, beta-carotene, and active glycoconjugates for visual acuity and deep cellular immunity.")
                        .imageUrl("https://images.unsplash.com/photo-1550572017-ed26177b96ad?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.8"))
                        .reviewsCount(89)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Turmeric Curcumin 1500mg")
                        .genericName("Curcuma Longa 95% Curcuminoids + BioPerine")
                        .sku("SKU-VIT-TUR-1500")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("84.00"))
                        .category("Dietary & Vits")
                        .stockQuantity(220)
                        .msrp(new BigDecimal("98.00"))
                        .cogs(new BigDecimal("34.00"))
                        .description("Standardized 95% active curcuminoids enhanced with black pepper fruit extract (BioPerine) for 2000% superior bioavailability and systemic joint comfort.")
                        .imageUrl("https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(245)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Cellular Nutrition NAD+ Complex")
                        .genericName("Nicotinamide Riboside & Resveratrol Complex")
                        .sku("SKU-VIT-CEL-NAD")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("90.00"))
                        .category("Dietary & Vits")
                        .stockQuantity(95)
                        .msrp(new BigDecimal("105.00"))
                        .cogs(new BigDecimal("38.00"))
                        .description("Advanced cellular longevity catalyst designed to replenish NAD+ coenzyme reserves, stimulate sirtuin enzymatic activity, and optimize mitochondrial bioenergetics.")
                        .imageUrl("https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("5.0"))
                        .reviewsCount(178)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Vitamin D3 5000 IU + K2 (MK-7)")
                        .genericName("Cholecalciferol & Menaquinone-7 in Organic MCT Oil")
                        .sku("SKU-VIT-D3K2-05")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("38.00"))
                        .category("Dietary & Vits")
                        .stockQuantity(310)
                        .msrp(new BigDecimal("45.00"))
                        .cogs(new BigDecimal("14.50"))
                        .description("Synergistic micro-emulsified Vitamin D3 paired with all-trans Menaquinone-7 (MK-7) to direct calcium safely into bone matrix and away from arterial pathways.")
                        .imageUrl("https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(310)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Triple Strength Omega-3 Fish Oil")
                        .genericName("Molecularly Distilled EPA 1400mg & DHA 480mg")
                        .sku("SKU-VIT-OMG-TRP")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("48.00"))
                        .category("Dietary & Vits")
                        .stockQuantity(260)
                        .msrp(new BigDecimal("58.00"))
                        .cogs(new BigDecimal("19.00"))
                        .description("Pharmaceutical-grade enteric-coated marine lipid softgels offering high-dose EPA/DHA fatty acids for healthy cardiovascular rhythm, lipid balance, and brain function.")
                        .imageUrl("https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.8"))
                        .reviewsCount(194)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Magnesium Glycinate 400mg Pure Chelate")
                        .genericName("TRAACS Fully Chelated Magnesium Bisglycinate")
                        .sku("SKU-VIT-MAG-400")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("34.00"))
                        .category("Dietary & Vits")
                        .stockQuantity(340)
                        .msrp(new BigDecimal("40.00"))
                        .cogs(new BigDecimal("13.00"))
                        .description("High-absorption bisglycinate chelate formulated for gentle gastrointestinal tolerance, nocturnal relaxation, muscular restoration, and deep sleep cycles.")
                        .imageUrl("https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(420)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Zinc Picolinate 50mg Immunity Defense")
                        .genericName("Zinc Picolinate Chelate with Vitamin C")
                        .sku("SKU-VIT-ZNC-050")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("26.00"))
                        .category("Vitamins & Supps")
                        .stockQuantity(275)
                        .msrp(new BigDecimal("32.00"))
                        .cogs(new BigDecimal("9.50"))
                        .description("Picolinic acid bound zinc designed for maximal cellular transport, DNA synthesis, wound healing, and acute seasonal immune system defense.")
                        .imageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.7"))
                        .reviewsCount(165)
                        .createdAt(LocalDateTime.now())
                        .build(),
                // Skin Care Treatments
                Medicine.builder()
                        .name("Hyaluronic Acid Multi-Depth Hydrating Serum")
                        .genericName("Pure Sodium Hyaluronate Multi-Molecular Complex")
                        .sku("SKU-SKN-HYA-060")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("42.00"))
                        .category("Skin Care Treatments")
                        .stockQuantity(160)
                        .msrp(new BigDecimal("50.00"))
                        .cogs(new BigDecimal("15.00"))
                        .description("Dermatologist-formulated multi-molecular hyaluronic acid delivers deep epidermic hydration, smoothing fine dehydration lines and plumping tissue.")
                        .imageUrl("https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(142)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Ceramide Barrier Defense Cream 100ml")
                        .genericName("Ceramide NP, AP, EOP with Phytosphingosine")
                        .sku("SKU-SKN-CER-100")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("36.00"))
                        .category("Skin Care Treatments")
                        .stockQuantity(195)
                        .msrp(new BigDecimal("44.00"))
                        .cogs(new BigDecimal("12.50"))
                        .description("Clinical barrier repair cream replenishing three essential lipid ceramides to calm eczema, restore lipid membranes, and seal in lasting hydration.")
                        .imageUrl("https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.8"))
                        .reviewsCount(98)
                        .createdAt(LocalDateTime.now())
                        .build(),
                // Diabetes Care
                Medicine.builder()
                        .name("Metformin Hydrochloride 500mg Extended Release")
                        .genericName("Metformin HCl Extended-Release Tablets USP")
                        .sku("SKU-DIA-MET-500")
                        .requiresPrescription(true)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("28.00"))
                        .category("Diabetes Care")
                        .stockQuantity(240)
                        .msrp(new BigDecimal("35.00"))
                        .cogs(new BigDecimal("8.00"))
                        .description("First-line biguanide antihyperglycemic medication designed to improve glycemic control by decreasing hepatic glucose production and intestinal absorption.")
                        .imageUrl("https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.8"))
                        .reviewsCount(210)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Precision Blood Glucose Test Strips 50ct")
                        .genericName("Electrochemical Biosensor Glucose Strips")
                        .sku("SKU-DIA-STR-050")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("32.00"))
                        .category("Diabetes Care")
                        .stockQuantity(300)
                        .msrp(new BigDecimal("40.00"))
                        .cogs(new BigDecimal("11.00"))
                        .description("High-precision electrochemical test strips delivering laboratory-grade blood glucose readings in under 5 seconds with tiny 0.6µL sample size.")
                        .imageUrl("https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(185)
                        .createdAt(LocalDateTime.now())
                        .build(),
                // Pain Relief
                Medicine.builder()
                        .name("Ibuprofen 400mg Rapid Action Softgels")
                        .genericName("Solubilized Ibuprofen Liquid-Filled Capsules")
                        .sku("SKU-PAI-IBU-400")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("18.50"))
                        .category("Pain Relief")
                        .stockQuantity(410)
                        .msrp(new BigDecimal("24.00"))
                        .cogs(new BigDecimal("6.00"))
                        .description("Rapid-dissolve liquid softgels providing targeted anti-inflammatory relief from migraines, toothaches, musculoskeletal aches, and fever.")
                        .imageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(360)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Acetaminophen Extra Strength 500mg")
                        .genericName("Paracetamol / Acetaminophen 500mg Caplets")
                        .sku("SKU-PAI-ACT-500")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("15.00"))
                        .category("Pain Relief")
                        .stockQuantity(380)
                        .msrp(new BigDecimal("20.00"))
                        .cogs(new BigDecimal("5.00"))
                        .description("Clinically proven fast-acting analgesic and antipyretic for effective relief of acute tension headaches, minor arthritis discomfort, and fever.")
                        .imageUrl("https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.8"))
                        .reviewsCount(290)
                        .createdAt(LocalDateTime.now())
                        .build(),
                // Allergy
                Medicine.builder()
                        .name("Cetirizine Hydrochloride 10mg 24hr Relief")
                        .genericName("Cetirizine HCl Second-Generation Antihistamine")
                        .sku("SKU-ALL-CET-010")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("22.00"))
                        .category("Allergy")
                        .stockQuantity(280)
                        .msrp(new BigDecimal("28.00"))
                        .cogs(new BigDecimal("7.50"))
                        .description("Non-drowsy 24-hour symptom control for seasonal allergic rhinitis, itchy watery eyes, sneezing, runny nose, and allergic urticaria hives.")
                        .imageUrl("https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(230)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Fluticasone Propionate Nasal Spray 50mcg")
                        .genericName("Fluticasone Propionate Glucocorticoid Suspension")
                        .sku("SKU-ALL-FLU-050")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("29.00"))
                        .category("Allergy")
                        .stockQuantity(190)
                        .msrp(new BigDecimal("36.00"))
                        .cogs(new BigDecimal("10.00"))
                        .description("Targeted intranasal corticosteroid spray providing 24-hour round-the-clock relief of nasal congestion, sinus pressure, sneezing, and itchy nose.")
                        .imageUrl("https://images.unsplash.com/photo-1550572017-ed26177b96ad?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.8"))
                        .reviewsCount(145)
                        .createdAt(LocalDateTime.now())
                        .build(),
                // Hair Care
                Medicine.builder()
                        .name("Biotin & Keratin Hair Growth Complex 60 Caps")
                        .genericName("D-Biotin 10,000mcg with Solubilized Keratin")
                        .sku("SKU-HAR-BIO-060")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("34.00"))
                        .category("Hair Care")
                        .stockQuantity(220)
                        .msrp(new BigDecimal("42.00"))
                        .cogs(new BigDecimal("11.00"))
                        .description("Clinical follicle vitality formula enriched with marine collagen, zinc, and pure D-biotin to stimulate dense growth and scalp health.")
                        .imageUrl("https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(180)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Rosemary Scalp Revitalizing Oil 100ml")
                        .genericName("Cold-Pressed Rosmarinus Officinalis & Castor Complex")
                        .sku("SKU-HAR-ROS-100")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("24.50"))
                        .category("Hair Care")
                        .stockQuantity(175)
                        .msrp(new BigDecimal("30.00"))
                        .cogs(new BigDecimal("7.50"))
                        .description("Organic rosemary and Jamaican black castor botanical blend proven to stimulate microcirculation and thicken thinning hair strands.")
                        .imageUrl("https://images.unsplash.com/photo-1608248597359-009c91d4e417?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.8"))
                        .reviewsCount(134)
                        .createdAt(LocalDateTime.now())
                        .build(),
                // Nail Care
                Medicine.builder()
                        .name("Clinical Keratin Nail Hardener & Cuticle Defense")
                        .genericName("Hydrolyzed Keratin Peptide Matrix with Jojoba")
                        .sku("SKU-NAL-KER-030")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("19.00"))
                        .category("Nail Care")
                        .stockQuantity(190)
                        .msrp(new BigDecimal("26.00"))
                        .cogs(new BigDecimal("6.00"))
                        .description("Deep-penetrating strengthening formula that bonds split, brittle nail plates while conditioning dry eponychium and cuticles.")
                        .imageUrl("https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.7"))
                        .reviewsCount(95)
                        .createdAt(LocalDateTime.now())
                        .build(),
                // Lips Care
                Medicine.builder()
                        .name("Hydrating Peptide Lip Treatment SPF 30")
                        .genericName("Palmitoyl Tripeptide-38 with Shea & Zinc Oxide")
                        .sku("SKU-LIP-PEP-015")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("16.50"))
                        .category("Lips Care")
                        .stockQuantity(260)
                        .msrp(new BigDecimal("22.00"))
                        .cogs(new BigDecimal("4.80"))
                        .description("Restorative plumping peptide balm providing broad-spectrum UV protection, moisture sealing, and dry chapped lip rehabilitation.")
                        .imageUrl("https://images.unsplash.com/photo-1599305090598-fe179d501227?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(215)
                        .createdAt(LocalDateTime.now())
                        .build(),
                // Eye Care
                Medicine.builder()
                        .name("Caffeine & Peptide Under-Eye Radiance Serum")
                        .genericName("5% Epigallocatechin Gallatyl Glucoside + Caffeine Solution")
                        .sku("SKU-EYE-CAF-015")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("28.00"))
                        .category("Eye Care")
                        .stockQuantity(140)
                        .msrp(new BigDecimal("35.00"))
                        .cogs(new BigDecimal("8.50"))
                        .description("Targeted clinical liquid formula reducing periorbital pigmentation, fluid retention puffiness, and fatigue around ocular tissues.")
                        .imageUrl("https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.8"))
                        .reviewsCount(162)
                        .createdAt(LocalDateTime.now())
                        .build(),
                Medicine.builder()
                        .name("Preservative-Free Lubricating Eye Drops 30ct")
                        .genericName("Carboxymethylcellulose Sodium 0.5% Ophthalmic")
                        .sku("SKU-EYE-DRP-030")
                        .requiresPrescription(false)
                        .isTemperatureSensitive(false)
                        .unitPrice(new BigDecimal("21.00"))
                        .category("Eye Care")
                        .stockQuantity(210)
                        .msrp(new BigDecimal("27.00"))
                        .cogs(new BigDecimal("6.20"))
                        .description("Single-use sterile soothing tears providing immediate relief from ocular dryness, digital strain, and seasonal conjunctival irritation.")
                        .imageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80")
                        .rating(new BigDecimal("4.9"))
                        .reviewsCount(190)
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        for (Medicine med : dailyEssentials) {
            if (!medicineRepository.existsBySku(med.getSku())) {
                medicineRepository.save(med);
                System.out.println("[MedicineService] Seeded medicine catalog item: " + med.getName());
            }
        }

        // Normalize categories to strictly the 5 official categories and initialize batch / shelf-life data
        List<Medicine> allInDb = medicineRepository.findAll();
        for (Medicine m : allInDb) {
            boolean updated = false;
            String cat = m.getCategory() != null ? m.getCategory().trim() : "";
            String normalizedCat = cat;

            if (Boolean.TRUE.equals(m.getRequiresPrescription()) || cat.equalsIgnoreCase("Prescription Rx") || cat.equalsIgnoreCase("Cardiovascular") || cat.equalsIgnoreCase("Diabetes Care")) {
                normalizedCat = "Prescription Medicines";
            } else if (cat.equalsIgnoreCase("Dietary & Vits") || cat.equalsIgnoreCase("Vitamins & Supps")) {
                normalizedCat = "Vitamins & Nutritional Supplements";
            } else if (cat.equalsIgnoreCase("Skin Care Treatments") || cat.equalsIgnoreCase("Hair Care") || cat.equalsIgnoreCase("Nail Care") || cat.equalsIgnoreCase("Lips Care") || cat.equalsIgnoreCase("Dermatology") || cat.equalsIgnoreCase("Eye Care")) {
                normalizedCat = "Daily Health & Wellness";
            } else if (cat.equalsIgnoreCase("Pain Relief") || cat.equalsIgnoreCase("Allergy")) {
                normalizedCat = "First Aid & Wound Care";
            } else if (cat.equalsIgnoreCase("Mental Wellness") || cat.equalsIgnoreCase("General")) {
                normalizedCat = "Home Health & Medical Care";
            }

            if (!normalizedCat.equals(m.getCategory())) {
                m.setCategory(normalizedCat);
                updated = true;
            }

            // Ensure batch number
            if (m.getBatchNumber() == null || m.getBatchNumber().trim().isEmpty()) {
                m.setBatchNumber("LOT-" + (m.getSku() != null ? m.getSku() : "MED" + m.getId()) + "-25");
                updated = true;
            }

            // Ensure manufacturing date
            if (m.getManufacturingDate() == null) {
                m.setManufacturingDate(LocalDate.now().minusMonths((m.getId() % 6) + 3));
                updated = true;
            }

            // Ensure expiry date (provide diverse realistic shelf life: safe, near expiry < 60 days, expired)
            if (m.getExpiryDate() == null) {
                if (m.getId() % 7 == 0) {
                    // Expired batch (< 0 days) for testing
                    m.setExpiryDate(LocalDate.now().minusDays(15));
                } else if (m.getId() % 5 == 0) {
                    // Near expiry (< 60 days) for testing
                    m.setExpiryDate(LocalDate.now().plusDays(35));
                } else {
                    // Good shelf life (> 60 days)
                    m.setExpiryDate(LocalDate.now().plusMonths(12 + (m.getId() % 12)));
                }
                updated = true;
            }

            // Ensure shelf location
            if (m.getShelfLocation() == null || m.getShelfLocation().trim().isEmpty()) {
                char aisle = (char) ('A' + (m.getId() % 4));
                int shelfNum = (int) ((m.getId() % 8) + 1);
                m.setShelfLocation("Shelf " + aisle + "-0" + shelfNum);
                updated = true;
            }

            // Ensure allocated stock & reorder level
            if (m.getAllocatedStock() == null) {
                m.setAllocatedStock((int) (m.getId() % 12));
                updated = true;
            }
            if (m.getReorderLevel() == null) {
                m.setReorderLevel(30);
                updated = true;
            }
            if (m.getIsQuarantined() == null) {
                m.setIsQuarantined(false);
                updated = true;
            }
            if (m.getCogs() == null && m.getUnitPrice() != null) {
                m.setCogs(m.getUnitPrice().multiply(new BigDecimal("0.45")).setScale(2, RoundingMode.HALF_UP));
                updated = true;
            }

            // Ensure barcode
            if (m.getBarcode() == null || m.getBarcode().trim().isEmpty()) {
                m.setBarcode("BC-" + (m.getSku() != null ? m.getSku().replace("SKU-", "") : "MED" + m.getId()));
                updated = true;
            }

            // Ensure storage requirement
            if (m.getStorageRequirement() == null || m.getStorageRequirement().trim().isEmpty()) {
                m.setStorageRequirement(Boolean.TRUE.equals(m.getIsTemperatureSensitive())
                        ? "Cold Chain (2°C - 8°C)"
                        : "Room Temperature (15°C - 25°C)");
                updated = true;
            }

            // Ensure tags (OTC, Rx, Cold Chain)
            if (m.getTags() == null || m.getTags().trim().isEmpty()) {
                List<String> tagList = new ArrayList<>();
                if (Boolean.TRUE.equals(m.getRequiresPrescription())) {
                    tagList.add("Rx");
                } else {
                    tagList.add("OTC");
                }
                if (Boolean.TRUE.equals(m.getIsTemperatureSensitive())) {
                    tagList.add("Cold Chain");
                }
                m.setTags(String.join(", ", tagList));
                updated = true;
            }

            if (updated) {
                medicineRepository.save(m);
            }
        }

        // Ensure at least one Delivery Coordinator exists for stock reorder alerts
        if (!userRepository.existsByEmail("coordinator@pharmacy.com")) {
            String encodedPassword = passwordEncoder != null
                    ? passwordEncoder.encode("coordinator123")
                    : "$2a$10$wW5g7p7D.K3tS0qZ8d1c7eqBv.VkWvG.P8w0J2J5c7bWqB1x";
            com.mediorder.model.User coordinator = com.mediorder.model.User.builder()
                    .email("coordinator@pharmacy.com")
                    .fullName("Logistics & Delivery Coordinator")
                    .passwordHash(encodedPassword)
                    .role(com.mediorder.model.Role.DELIVERY_COORDINATOR)
                    .phoneNumber("+94770001122")
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(coordinator);
        }

        // Ensure default Operations Manager exists
        if (!userRepository.existsByEmail("operations@pharmacy.com")) {
            String encodedPassword = passwordEncoder != null
                    ? passwordEncoder.encode("operations123")
                    : "$2a$10$wW5g7p7D.K3tS0qZ8d1c7eqBv.VkWvG.P8w0J2J5c7bWqB1x";
            com.mediorder.model.User ops = com.mediorder.model.User.builder()
                    .email("operations@pharmacy.com")
                    .fullName("Chief Operations Manager")
                    .passwordHash(encodedPassword)
                    .role(com.mediorder.model.Role.OPERATIONS_MANAGER)
                    .phoneNumber("+94770001133")
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(ops);
        }

        // Ensure default Admin exists
        if (!userRepository.existsByEmail("admin@pharmacy.com")) {
            String encodedPassword = passwordEncoder != null
                    ? passwordEncoder.encode("admin123")
                    : "$2a$10$wW5g7p7D.K3tS0qZ8d1c7eqBv.VkWvG.P8w0J2J5c7bWqB1x";
            com.mediorder.model.User adm = com.mediorder.model.User.builder()
                    .email("admin@pharmacy.com")
                    .fullName("System Administrator")
                    .passwordHash(encodedPassword)
                    .role(com.mediorder.model.Role.ADMIN)
                    .phoneNumber("+94770001144")
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(adm);
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
                (m.getSku() != null && m.getSku().toLowerCase().contains(q)) ||
                (m.getBatchNumber() != null && m.getBatchNumber().toLowerCase().contains(q)) ||
                (m.getShelfLocation() != null && m.getShelfLocation().toLowerCase().contains(q))
            ).toList();
        }

        if (category != null && !category.trim().isEmpty() && 
            !category.equalsIgnoreCase("all") && 
            !category.equalsIgnoreCase("all items") && 
            !category.equalsIgnoreCase("all categories") && 
            !category.equalsIgnoreCase("all medications")) {
            String cat = category.trim().toLowerCase();
            list = list.stream().filter(m -> {
                if (m.getCategory() == null) return false;
                String mCat = m.getCategory().toLowerCase();
                if (mCat.equalsIgnoreCase(cat) || mCat.contains(cat) || cat.contains(mCat)) return true;
                if (cat.contains("prescription") && (mCat.contains("prescription") || Boolean.TRUE.equals(m.getRequiresPrescription()))) return true;
                if (cat.contains("wellness") || cat.contains("daily")) {
                    return mCat.contains("wellness") || mCat.contains("daily") || mCat.contains("skin") || mCat.contains("hair") || mCat.contains("nail") || mCat.contains("lip") || mCat.contains("eye") || mCat.contains("derm");
                }
                if (cat.contains("vitamin") || cat.contains("nutri") || cat.contains("supp")) {
                    return mCat.contains("vitamin") || mCat.contains("dietary") || mCat.contains("nutri") || mCat.contains("supp");
                }
                if (cat.contains("first aid") || cat.contains("wound")) {
                    return mCat.contains("first") || mCat.contains("wound") || mCat.contains("pain") || mCat.contains("allerg");
                }
                if (cat.contains("home") || cat.contains("medical care")) {
                    return mCat.contains("home") || mCat.contains("medical") || mCat.contains("care") || mCat.contains("diabet") || mCat.contains("cardio");
                }
                return false;
            }).toList();
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
            medicine.setCategory("Daily Health & Wellness");
        }
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

        // Stock & Expiry Tracking updates
        if (details.getBatchNumber() != null) existing.setBatchNumber(details.getBatchNumber().trim());
        if (details.getManufacturingDate() != null) existing.setManufacturingDate(details.getManufacturingDate());
        if (details.getExpiryDate() != null) existing.setExpiryDate(details.getExpiryDate());
        if (details.getShelfLocation() != null) existing.setShelfLocation(details.getShelfLocation().trim());
        if (details.getAllocatedStock() != null) existing.setAllocatedStock(details.getAllocatedStock());
        if (details.getReorderLevel() != null) existing.setReorderLevel(details.getReorderLevel());
        if (details.getIsQuarantined() != null) existing.setIsQuarantined(details.getIsQuarantined());

        return medicineRepository.save(existing);
    }

    public void deleteMedicine(Long id) {
        Medicine existing = getMedicineById(id);
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

    public Medicine quickAdjustStock(Long id, Map<String, Object> updates) {
        Medicine existing = getMedicineById(id);
        if (updates.containsKey("stockQuantity") && updates.get("stockQuantity") != null) {
            existing.setStockQuantity(((Number) updates.get("stockQuantity")).intValue());
        }
        if (updates.containsKey("allocatedStock") && updates.get("allocatedStock") != null) {
            existing.setAllocatedStock(((Number) updates.get("allocatedStock")).intValue());
        }
        if (updates.containsKey("reorderLevel") && updates.get("reorderLevel") != null) {
            existing.setReorderLevel(((Number) updates.get("reorderLevel")).intValue());
        }
        if (updates.containsKey("shelfLocation") && updates.get("shelfLocation") != null) {
            existing.setShelfLocation(String.valueOf(updates.get("shelfLocation")).trim());
        }
        if (updates.containsKey("cogs") && updates.get("cogs") != null) {
            existing.setCogs(new BigDecimal(String.valueOf(updates.get("cogs"))));
        }
        if (updates.containsKey("unitPrice") && updates.get("unitPrice") != null) {
            existing.setUnitPrice(new BigDecimal(String.valueOf(updates.get("unitPrice"))));
        }
        if (updates.containsKey("batchNumber") && updates.get("batchNumber") != null) {
            existing.setBatchNumber(String.valueOf(updates.get("batchNumber")).trim());
        }
        if (updates.containsKey("barcode") && updates.get("barcode") != null) {
            existing.setBarcode(String.valueOf(updates.get("barcode")).trim());
        }
        if (updates.containsKey("storageRequirement") && updates.get("storageRequirement") != null) {
            existing.setStorageRequirement(String.valueOf(updates.get("storageRequirement")).trim());
        }
        if (updates.containsKey("tags") && updates.get("tags") != null) {
            existing.setTags(String.valueOf(updates.get("tags")).trim());
        }
        if (updates.containsKey("manufacturingDate") && updates.get("manufacturingDate") != null) {
            String mDate = String.valueOf(updates.get("manufacturingDate")).trim();
            if (!mDate.isEmpty()) {
                existing.setManufacturingDate(LocalDate.parse(mDate));
            }
        }
        if (updates.containsKey("expiryDate") && updates.get("expiryDate") != null) {
            String eDate = String.valueOf(updates.get("expiryDate")).trim();
            if (!eDate.isEmpty()) {
                existing.setExpiryDate(LocalDate.parse(eDate));
            }
        }
        return medicineRepository.save(existing);
    }

    public Medicine toggleQuarantine(Long id, Boolean quarantined, String reason) {
        Medicine existing = getMedicineById(id);
        existing.setIsQuarantined(quarantined != null ? quarantined : !Boolean.TRUE.equals(existing.getIsQuarantined()));
        return medicineRepository.save(existing);
    }

    public Map<String, Object> createReorderPO(Long id, Integer quantity, String supplierNotes, String requesterEmail) {
        Medicine medicine = getMedicineById(id);
        int reorderQty = quantity != null && quantity > 0 ? quantity : (medicine.getReorderLevel() * 2);
        String poNumber = "PO-" + LocalDate.now().getYear() + "-" + String.format("%05d", (System.currentTimeMillis() % 100000));

        // Find delivery coordinators or admins to alert
        List<com.mediorder.model.User> coordinators = userRepository.findByRole(com.mediorder.model.Role.DELIVERY_COORDINATOR);
        if (coordinators.isEmpty()) {
            coordinators = userRepository.findByRole(com.mediorder.model.Role.ADMIN);
        }

        String alertTitle = "Stock Reorder Alert: PO Generated (" + poNumber + ")";
        String alertMsg = String.format("Purchase Order %s created for %s (SKU: %s). Reorder Qty: %d units. Shelf Location: %s. Current On-Hand: %d (Reorder Level: %d). %s",
                poNumber, medicine.getName(), medicine.getSku(), reorderQty, medicine.getShelfLocation(),
                medicine.getStockQuantity(), medicine.getReorderLevel(),
                supplierNotes != null && !supplierNotes.isBlank() ? "Notes: " + supplierNotes : "");

        for (com.mediorder.model.User coord : coordinators) {
            com.mediorder.model.Notification notif = new com.mediorder.model.Notification(
                    null,
                    coord,
                    alertTitle,
                    alertMsg,
                    com.mediorder.model.NotificationChannel.IN_APP,
                    false,
                    LocalDateTime.now()
            );
            notificationRepository.save(notif);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("poNumber", poNumber);
        result.put("medicineId", medicine.getId());
        result.put("medicineName", medicine.getName());
        result.put("sku", medicine.getSku());
        result.put("reorderQuantity", reorderQty);
        result.put("currentStock", medicine.getStockQuantity());
        result.put("shelfLocation", medicine.getShelfLocation());
        result.put("coordinatorsNotified", coordinators.size());
        result.put("status", "SUBMITTED");
        result.put("createdAt", LocalDateTime.now().toString());
        return result;
    }
}
