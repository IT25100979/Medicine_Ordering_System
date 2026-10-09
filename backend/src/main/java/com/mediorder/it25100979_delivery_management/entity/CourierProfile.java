package com.mediorder.it25100979_delivery_management.entity;

import jakarta.persistence.*;
import lombok.*;

/** Links a courier login (users.role = DELIVERY_RIDER) to the courier company they work for. */
@Entity
@Table(name = "courier_profiles", uniqueConstraints = @UniqueConstraint(name = "uk_courier_user", columnNames = "user_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourierProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Display name of the courier partner, e.g. "In Company Delivery". */
    @Column(name = "courier_company", nullable = false)
    private String courierCompany;
}
