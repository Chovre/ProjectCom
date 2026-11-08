package com.ledgerline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerline.entity.IdempotencyRecord;
import com.ledgerline.entity.enums.IdempotencyStatus;
import com.ledgerline.exception.IdempotencyConflictException;
import com.ledgerline.repository.IdempotencyRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyRecordRepository idempotencyRecordRepository;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    public String generateFingerprint(Object request) {
        if (request == null) {
            return "empty";
        }
        try {
            String json = objectMapper.writeValueAsString(request);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException | com.fasterxml.jackson.core.JsonProcessingException e) {
            log.warn("Failed to generate fingerprint hash, falling back to string hash", e);
            return String.valueOf(request.hashCode());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<String> checkOrCreate(String idempotencyKey, Long userId, String operationType, String fingerprint) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }

        Optional<IdempotencyRecord> existingOpt = idempotencyRecordRepository.findByIdempotencyKeyAndUserId(idempotencyKey, userId);

        if (existingOpt.isPresent()) {
            IdempotencyRecord record = existingOpt.get();

            if (!record.getRequestFingerprint().equals(fingerprint)) {
                throw new IdempotencyConflictException("Idempotency key '" + idempotencyKey + "' was previously used with different request parameters.");
            }

            if (record.getStatus() == IdempotencyStatus.PROCESSING) {
                throw new IdempotencyConflictException("A request with idempotency key '" + idempotencyKey + "' is currently being processed.");
            }

            if (record.getStatus() == IdempotencyStatus.COMPLETED) {
                log.info("Idempotent replay detected for key: {}", idempotencyKey);
                return Optional.ofNullable(record.getResponseData());
            }

            // If FAILED, allow re-trying by updating record to PROCESSING
            record.setStatus(IdempotencyStatus.PROCESSING);
            record.setRequestFingerprint(fingerprint);
            idempotencyRecordRepository.save(record);
            return Optional.empty();
        }

        IdempotencyRecord newRecord = IdempotencyRecord.builder()
                .idempotencyKey(idempotencyKey)
                .userId(userId)
                .operationType(operationType)
                .requestFingerprint(fingerprint)
                .status(IdempotencyStatus.PROCESSING)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        idempotencyRecordRepository.save(newRecord);
        return Optional.empty();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markCompleted(String idempotencyKey, Long userId, Object response) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }
        try {
            String responseJson = objectMapper.writeValueAsString(response);
            idempotencyRecordRepository.findByIdempotencyKeyAndUserId(idempotencyKey, userId).ifPresent(record -> {
                record.setStatus(IdempotencyStatus.COMPLETED);
                record.setResponseData(responseJson);
                idempotencyRecordRepository.save(record);
            });
        } catch (Exception e) {
            log.error("Failed to mark idempotency record completed: {}", idempotencyKey, e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(String idempotencyKey, Long userId) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }
        idempotencyRecordRepository.findByIdempotencyKeyAndUserId(idempotencyKey, userId).ifPresent(record -> {
            record.setStatus(IdempotencyStatus.FAILED);
            idempotencyRecordRepository.save(record);
        });
    }
}

