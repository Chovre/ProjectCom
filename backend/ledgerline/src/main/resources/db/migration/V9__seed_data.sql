-- Development seed data - DO NOT use in production
-- Admin password: Admin@123 (BCrypt hashed)
-- Auditor password: Auditor@123 (BCrypt hashed)  
-- Customer1 password: Customer1@123 (BCrypt hashed)
-- Customer2 password: Customer2@123 (BCrypt hashed)

INSERT INTO users (full_name, email, password_hash, phone, role, status) VALUES
('System Administrator', 'admin@ledgerline.com', '$2a$10$l.CReN9UGFRDly14Q948tuchR.ITUpjwVvqFN1zw1V5vmiix1SP9.', '9000000001', 'ADMIN', 'ACTIVE'),
('Financial Auditor', 'auditor@ledgerline.com', '$2a$10$clZGhkFBM8uNS2x7z1MKyudthJNJ7YqdH9yCnnmlWUV79iYOIIECW', '9000000002', 'AUDITOR', 'ACTIVE'),
('Rahul Sharma', 'rahul@example.com', '$2a$10$FPvvoEsxUTYCjlHY/bd3BO8e2FC58dHloTgY6Wa1iLONLEQPZCUEm', '9000000003', 'ACCOUNT_HOLDER', 'ACTIVE'),
('Priya Patel', 'priya@example.com', '$2a$10$gbBj7a6DxZrjMWkKTSGpUOD386U5tApFi.kP1PEV/jlNiGxYhBH9m', '9000000004', 'ACCOUNT_HOLDER', 'ACTIVE');

-- Create demo accounts with strictly zero opening balances
-- All initial balances are 0.0000 per Strict Manual Money Input requirement.
-- Funding must occur via explicitly authorized manual deposit transactions.
INSERT INTO accounts (account_number, user_id, account_type, currency, balance, status) VALUES
('ACC1000000001', 3, 'SAVINGS', 'INR', 0.0000, 'ACTIVE'),
('ACC1000000002', 3, 'CURRENT', 'INR', 0.0000, 'ACTIVE'),
('ACC1000000003', 4, 'SAVINGS', 'INR', 0.0000, 'ACTIVE');

-- System audit log for initial seed
INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, description) VALUES
(1, 'SEED_DATA', 'SYSTEM', '0', 'Initial demo users and zero-balance accounts initialized');
