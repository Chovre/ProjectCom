CREATE TABLE idempotency_records (
    id BIGSERIAL PRIMARY KEY,
    idempotency_key VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    request_fingerprint VARCHAR(512) NOT NULL,
    response_data TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(idempotency_key, user_id)
);

CREATE INDEX idx_idempotency_key ON idempotency_records(idempotency_key);
CREATE INDEX idx_idempotency_user ON idempotency_records(user_id);
