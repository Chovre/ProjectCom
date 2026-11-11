# LedgerLine System Requirements & Prompts

This document contains the prompt specifications and architectural requirements for **LedgerLine — Secure Financial Transaction & Ledger Management System**.

---

## 25. ADMIN APPROVAL-BASED DEPOSIT REQUEST SYSTEM

Implement a complete deposit request and administrator approval workflow.

### A. Customer Deposit Request

When a customer clicks "Deposit Money", display a deposit request form with:

**Customer Information**
- Account holder name (from authenticated profile)
- LedgerLine account number
- Registered mobile number

**Bank Information**
- Bank name
- Bank account number
- Confirm bank account number
- IFSC code

**Deposit Information**
- Manually entered deposit amount (mandatory)
- Currency (INR)
- Payment method: Bank Transfer, UPI, or Cash Deposit
- Transaction reference number (if available)
- Optional payment receipt upload
- Deposit description

Do not prefill any amount. Never request ATM PIN, CVV, OTP, or banking password.

---

### B. Deposit Request Submission

When the customer submits the form:

1. Validate all submitted information.
2. Create a unique deposit request ID (`DEP-REQ-<timestamp>-<rand>`).
3. Save the request in PostgreSQL.
4. Set its status to `PENDING`.
5. **Do not update the customer's account balance.**
6. Display: *"Your deposit request has been submitted successfully and is waiting for admin approval."*
7. Show the request in the customer's Deposit Request History.

---

### C. Admin Deposit Management

Create an Admin Dashboard section called **"Deposit Requests"**.

Display:
- Request ID
- Customer name
- Customer account number (masked as `XXXXXX1234`)
- Bank name
- IFSC code
- Requested amount
- Payment method
- Transaction reference
- Submission date
- Payment evidence
- Current status (`PENDING`, `APPROVED`, `REJECTED`, `FAILED`)

Provide these actions:
- **View Details**
- **Approve**
- **Reject**

Before approval, the administrator must verify that the money has actually been received or that the authorised funding process has successfully settled.

Before rejection, require a rejection reason.

---

### D. Admin Approval Processing

When the administrator approves a pending deposit:

1. Verify the administrator's authorization (`ROLE_ADMIN`).
2. Lock the relevant customer account to prevent concurrent balance updates (`SELECT ... FOR UPDATE`).
3. Verify that the request is still `PENDING`.
4. Verify that the funding has actually been received or settled.
5. Create a deposit transaction.
6. Create the corresponding `CREDIT` ledger entry.
7. Update the customer's account balance atomically.
8. Change request status to `APPROVED`.
9. Save the administrator ID, approval timestamp, and transaction reference.
10. Record the action in the audit log.

All database operations must happen within one transaction. Prevent duplicate approvals and duplicate balance credits using database constraints and idempotency.

---

### E. Admin Rejection Processing

When an administrator rejects a request:

1. Require a rejection reason.
2. Change request status to `REJECTED`.
3. Record administrator ID and rejection timestamp.
4. Save the rejection reason.
5. Add an audit log entry.
6. Notify the customer.
7. Do not credit the customer's account.

---

### F. Customer Deposit Status

The customer must be able to view these statuses:

- `PENDING` — Waiting for administrator review.
- `APPROVED` — Deposit approved and credited after funding verification.
- `REJECTED` — Request rejected with reason.
- `FAILED` — Funding or processing failed.

Display the status, amount, request ID, submission date, approval/rejection date, and administrator remarks.

---

### G. Database Design

Create a `deposit_requests` table containing:

- `id` (BIGSERIAL PRIMARY KEY)
- `request_reference` (VARCHAR(64) UNIQUE)
- `customer_id` (BIGINT REFERENCES users(id))
- `account_id` (BIGINT REFERENCES accounts(id))
- `bank_name` (VARCHAR(128))
- `bank_account_number` (VARCHAR(64) masked/encrypted)
- `ifsc_code` (VARCHAR(32))
- `amount` (`NUMERIC(19,4)`, NOT FLOAT/DOUBLE)
- `currency` (VARCHAR(8) DEFAULT 'INR')
- `payment_method` (VARCHAR(32))
- `transaction_reference` (VARCHAR(128))
- `payment_proof_path` (VARCHAR(512))
- `status` (VARCHAR(32) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'FAILED')))
- `rejection_reason` (TEXT)
- `admin_id` (BIGINT REFERENCES users(id))
- `submitted_at` (TIMESTAMP)
- `reviewed_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

Add foreign keys, indexes, validation, and constraints. Never store sensitive card credentials, PINs, CVVs, OTPs, or banking passwords.

---

### H. API Endpoints

#### Customer:
- `POST /api/deposits/requests` — Submit deposit request
- `GET /api/deposits/my-requests` — View customer's deposit requests
- `GET /api/deposits/requests/{id}` — View deposit request by ID

#### Admin:
- `GET /api/admin/deposits/pending` — List pending deposit requests
- `GET /api/admin/deposits` — List all deposit requests with optional status filter
- `GET /api/admin/deposits/{id}` — View deposit request details
- `PUT /api/admin/deposits/{id}/approve` — Approve pending request & atomically credit funds
- `PUT /api/admin/deposits/{id}/reject` — Reject request with mandatory reason

Enforce authentication, role-based authorization, ownership checks, and server-side validation.

---

### I. Financial Security Rules

- A submitted request must never automatically increase the balance.
- Only an authorised administrator can approve a request.
- Approval must happen only after actual funds are verified.
- Never credit the same request twice (idempotency & row locking).
- Use `BigDecimal` for all monetary calculations.
- Use PostgreSQL row-level locking for concurrent account updates (`PessimisticWrite`).
- Maintain double-entry ledger consistency.
- Record all approvals and rejections in immutable audit logs.
- Do not generate default balances, random money, or automatic deposits.
- Preserve existing LedgerLine database records.

---

### J. Acceptance Testing

Verify:
1. Customer submits a deposit request.
2. Request appears in Admin Dashboard.
3. Customer balance remains unchanged while pending.
4. Admin can view and verify the request.
5. Admin approves the request after confirming funds.
6. Customer balance increases by exactly the manually requested and verified amount.
7. Customer sees `APPROVED` status and receipt.
8. Rejected requests never credit the account.
9. Two simultaneous approval requests cannot credit the same deposit twice.
10. Unauthorized customers cannot approve or view other customers' requests.

