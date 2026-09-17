package com.mediorder.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(name = "prescribed_dosage")
    private String prescribedDosage;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "permitted_quantity")
    private Integer permittedQuantity;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ItemDecision decision = ItemDecision.PENDING;
}