CREATE TABLE account_applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    account_type VARCHAR(20) NOT NULL DEFAULT 'SAVINGS' CHECK (account_type IN ('SAVINGS', 'CURRENT')),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_account_applications_user_id ON account_applications(user_id);
CREATE INDEX idx_account_applications_status ON account_applications(status);
