package com.agenthire.service;

import com.agenthire.entity.AuditLog;
import com.agenthire.entity.User;
import com.agenthire.repository.AuditLogRepository;
import com.agenthire.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void logEvent(UUID userId, String action, String entityType, UUID entityId, String description, String metadataJson, String ipAddress) {
        try {
            User user = null;
            if (userId != null) {
                user = userRepository.findById(userId).orElse(null);
            }

            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(description)
                    .metadataJson(metadataJson)
                    .ipAddress(ipAddress)
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Recorded audit log: action={}, entityType={}, entityId={}", action, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to record audit log: action={}, entityType={}", action, entityType, e);
        }
    }
}
