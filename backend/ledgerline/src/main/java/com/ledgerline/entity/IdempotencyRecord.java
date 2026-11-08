package com.ledgerline.entity;

import com.ledgerline.entity.enums.IdempotencyStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "idempotency_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdempotencyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "operation_type", nullable = false)
    private String operationType;

    @Column(name = "request_fingerprint")
    private String requestFingerprint;

    @Column(name = "response_data", columnDefinition = "TEXT")
    private String responseData;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private IdempotencyStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = IdempotencyStatus.PROCESSING;
        }
    }
}
