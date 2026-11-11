CREATE TABLE deposit_requests (
    id BIGSERIAL PRIMARY KEY,
    request_reference VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(100),
    ifsc_code VARCHAR(20),
    source_account_holder VARCHAR(150),
    amount NUMERIC(19, 4) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(30) NOT NULL,
    transaction_reference VARCHAR(100),
    payment_proof_path VARCHAR(255),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'FAILED')),
    rejection_reason TEXT,
    admin_notes TEXT,
    admin_id BIGINT REFERENCES users(id),
    transaction_id BIGINT REFERENCES transactions(id),
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deposit_requests_ref ON deposit_requests(request_reference);
CREATE INDEX idx_deposit_requests_user ON deposit_requests(user_id);
CREATE INDEX idx_deposit_requests_account ON deposit_requests(account_id);
CREATE INDEX idx_deposit_requests_status ON deposit_requests(status);
CREATE INDEX idx_deposit_requests_submitted ON deposit_requests(submitted_at);
