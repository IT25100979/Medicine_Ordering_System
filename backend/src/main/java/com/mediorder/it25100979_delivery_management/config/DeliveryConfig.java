package com.mediorder.it25100979_delivery_management.config;

import org.springframework.context.annotation.Configuration;

/**
 * Delivery Management module (IT25100979).
 *
 * <pre>
 * config/       module configuration, URL security rules, seed data
 * controller/   REST endpoints (coordinator, customer, courier, zones)
 * dto/request   validated request bodies
 * dto/response  response views per audience (staff / courier / customer)
 * entity/       JPA entities
 * enums/        DeliveryStatus state machine, courier partners, admin actions
 * event/        DeliveryLifecycleEvent + DeliveryEventType (what observers receive)
 * observer/     Observer pattern: DeliverySubject, DeliveryObserver, DeliveryEventPublisher
 * observer/impl concrete observers (timeline, order sync, audit, realtime, notifications)
 * exception/    module exceptions + their HTTP mapping
 * mapper/       entity -> DTO conversion
 * repository/   Spring Data repositories
 * service/      business logic
 * validation/   custom Bean Validation constraints
 * </pre>
 */
@Configuration
public class DeliveryConfig {
}
