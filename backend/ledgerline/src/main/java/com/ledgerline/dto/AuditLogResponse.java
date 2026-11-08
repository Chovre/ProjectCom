package com.ledgerline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {

    private Long id;
    private String actorName;
    private String action;
    private String entityType;
    private String entityId;
    private String description;
    private String ipAddress;
    private LocalDateTime createdAt;
}
