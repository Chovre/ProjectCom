package com.ledgerline.service;

import com.ledgerline.dto.AuditLogResponse;
import com.ledgerline.entity.AuditLog;
import com.ledgerline.entity.User;
import com.ledgerline.repository.AuditLogRepository;
import com.ledgerline.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long actorUserId, String action, String entityType, String entityId, String description, String ipAddress) {
        try {
            AuditLog auditLog = new AuditLog(actorUserId, action, entityType, entityId, description, ipAddress);
            auditLogRepository.save(auditLog);
        } catch (Exception ex) {
            log.error("Failed to persist audit log: action={}, actor={}, entity={}", action, actorUserId, entityType, ex);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getMyAuditLogs(Long userId, Pageable pageable) {
        return auditLogRepository.findByActorUserId(userId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAllAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogsByAction(String action, Pageable pageable) {
        return auditLogRepository.findByAction(action, pageable)
                .map(this::mapToResponse);
    }

    private AuditLogResponse mapToResponse(AuditLog logEntry) {
        String actorName = "System";
        if (logEntry.getActorUserId() != null && logEntry.getActorUserId() > 0) {
            actorName = userRepository.findById(logEntry.getActorUserId())
                    .map(User::getFullName)
                    .orElse("User #" + logEntry.getActorUserId());
        }

        return AuditLogResponse.builder()
                .id(logEntry.getId())
                .actorName(actorName)
                .action(logEntry.getAction())
                .entityType(logEntry.getEntityType())
                .entityId(logEntry.getEntityId())
                .description(logEntry.getDescription())
                .ipAddress(logEntry.getIpAddress())
                .createdAt(logEntry.getCreatedAt())
                .build();
    }
}

