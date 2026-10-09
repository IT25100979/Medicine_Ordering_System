package com.mediorder.it25100979_delivery_management.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DeliveryTimelineResponse {
    private String eventType;
    private String fromStatus;
    private String toStatus;
    private String description;
    private String actorName;
    private String actorRole;
    private LocalDateTime createdAt;
}
