package com.agenthire.dto.notification;

import com.agenthire.entity.enums.NotificationStatus;
import com.agenthire.entity.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private NotificationType type;
    private String title;
    private String message;
    private String relatedEntityType;
    private UUID relatedEntityId;
    private NotificationStatus status;
    private Instant readAt;
    private Instant createdAt;
}
