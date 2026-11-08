# LEDGERLINE — Secure Financial Transaction & Ledger Management System

A production-style full-stack financial transaction management application built with **Java 21**, **Spring Boot 3.2**, **PostgreSQL**, and **React (Vite + Tailwind CSS)**.

---

## 1. Project Overview & Problem Statement

Modern financial software systems face critical transaction integrity risks:
- **Duplicate Money Transfers:** Accidental double-clicks or network retry storms causing multiple debits.
- **Simultaneous Overdrafts (Race Conditions):** Two concurrent withdrawal requests against an account leading to negative balances.
- **Unauthorized Operations & Privilege Escalation:** Inadequate verification of account ownership and role scopes.
- **Audit Tampering & Missing Records:** Mutable database rows allowing history modification or deletion.
- **Inconsistent Ledgers:** Debiting one account without crediting the other, violating the fundamental law of double-entry accounting.

**LedgerLine** solves these problems by guaranteeing that every financial transaction is:
1. **Authenticated & Authorized:** Verified with signed JWT tokens, BCrypt password hashing, and role scopes (`ADMIN`, `AUDITOR`, `ACCOUNT_HOLDER`).
2. **Atomic & Consistent:** Governed by Spring Boot database transactions with strict ACID semantics.
3. **Pessimistically Locked:** PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) with deterministic ordering preventing deadlocks and overdrafts.
4. **Cryptographically Idempotent:** Stored database idempotency records with SHA-256 payload fingerprinting ensuring at-most-once execution.
5. **Double-Entry Balanced:** Every transfer produces matching, balanced `DEBIT` and `CREDIT` records where `Total Debit == Total Credit`.
6. **Immutable & Traceable:** Append-only database triggers blocking any `UPDATE` or `DELETE` on financial ledger entries and audit logs.
7. **Strictly Manual Money Input:** Zero automatic money, no predefined or default amounts, mandatory manual entry with two-decimal validation and explicit confirmation modals.

---

## 2. Technology Stack

### Backend
- **Language:** Java 21 LTS
- **Framework:** Spring Boot 3.2.5
- **Security:** Spring Security 6 with stateless JWT Bearer token authentication
- **ORM & Data Access:** Spring Data JPA / Hibernate with PostgreSQL Dialect
- **Database Migrations:** Flyway 10.10.0
- **API Documentation:** OpenAPI 3 / Swagger UI (`springdoc-openapi-starter-webmvc-ui` 2.5.0)
- **Monetary Precision:** Strict `java.math.BigDecimal` (scale 4, `NUMERIC(19,4)`)

### Database
- **Engine:** PostgreSQL 15+
- **Database Name:** `ledgerline_db`
- **Integrity Controls:** Foreign key constraints, unique constraints, check constraints (`balance >= 0`, `amount > 0`), and immutability triggers

### Frontend
- **Framework:** React 18 with Vite
- **Routing:** React Router DOM 6 (with role-based `ProtectedRoute` guards)
- **Styling:** Tailwind CSS 3.4
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **HTTP Client:** Centralized Axios instance with automatic authorization header injection

---

## 3. System Architecture

```
PROJECTGITUP/
├── backend/
│   └── ledgerline/
│       ├── pom.xml
│       └── src/
│           ├── main/
│           │   ├── java/com/ledgerline/
│           │   │   ├── config/          # OpenAPI & CORS configuration
│           │   │   ├── controller/      # REST API Controllers (Health, Auth, Account, Transaction, Admin, Auditor)
│           │   │   ├── dto/             # Request & Response DTOs
│           │   │   ├── entity/          # JPA Entities (User, Account, Transaction, LedgerEntry, IdempotencyRecord, AuditLog)
│           │   │   ├── entity/enums/    # Domain Enums (UserRole, AccountStatus, TransactionType, EntryType, etc.)
│           │   │   ├── exception/       # GlobalExceptionHandler & Custom Domain Exceptions
│           │   │   ├── repository/      # Spring Data Repositories with Pessimistic Locking
│           │   │   ├── security/        # JWT Filter, Token Provider, UserDetailsService, SecurityConfig
│           │   │   ├── service/         # Financial Transaction Engine, Idempotency, Audit, Ledger Reconciliation
│           │   │   └── util/            # Security & IP utilities
│           │   └── resources/
│           │       ├── application.properties
│           │       └── db/migration/    # Versioned Flyway migrations (V1 through V9)
│           └── test/
│               └── java/com/ledgerline/service/ # Automated unit tests (TransactionServiceTest, DoubleEntryLedgerTest, AuthServiceTest)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── api/            # Centralized axiosInstance & endpoints
        ├── components/     # StatCard, StatusBadge, LoadingSpinner, EmptyState, Pagination, ConfirmModal
        ├── context/        # AuthContext (JWT management & session hydration)
        ├── layouts/        # DashboardLayout (Role-based sidebar) & AuthLayout
        ├── pages/
        │   ├── auth/       # LandingPage, LoginPage, RegisterPage, AccessDeniedPage, NotFoundPage
        │   ├── customer/   # CustomerDashboard, AccountsPage, AccountDetailPage, DepositPage, WithdrawalPage, TransferPage, TransactionsPage, TransactionDetailPage
        │   ├── admin/      # AdminDashboard, UserManagement, AdminAccountsPage, ApplicationsPage, AdminTransactionsPage, AdminAuditPage
        │   └── auditor/    # AuditorDashboard, AuditorTransactionsPage, AuditorLedgerPage, AuditorAuditPage, ReconciliationPage
        └── routes/         # ProtectedRoute
```

---

## 4. Financial Transaction Engine & Invariants

### A. Deposit Workflow
1. Client generates a unique `Idempotency-Key` header.
2. Checks database idempotency record; returns cached result if already completed.
3. Authenticates caller and verifies account ownership or admin authority.
4. Verifies account status is `ACTIVE` and amount is strictly positive (`amount > 0`).
5. Acquires pessimistic write lock on the account row (`SELECT ... FOR UPDATE`).
6. Updates balance: `balance = balance.add(amount)`.
7. Inserts `Transaction` with status `SUCCESS` and type `DEPOSIT`.
8. Inserts immutable `CREDIT` ledger entry for the account.
9. Appends record to `audit_logs`.
10. Marks idempotency record `COMPLETED`.

### B. Withdrawal Workflow (Negative Balance Prevention)
1. Acquires row-level pessimistic write lock: `accountRepository.findByIdForUpdate(accountId)`.
2. Validates available balance: if `account.getBalance() < amount`, throws `InsufficientBalanceException`.
3. Deducts balance atomically: `balance = balance.subtract(amount)`.
4. Enforces database check constraint: `CHECK (balance >= 0)`.
5. Records transaction and immutable `DEBIT` ledger entry.

### C. Money Transfer Workflow (Deterministic Locking & Double-Entry Invariant)
To prevent deadlocks when two users simultaneously transfer funds to each other, LedgerLine implements **deterministic lock ordering**:
```java
Long firstId = Math.min(sourceAccountId, destAccountId);
Long secondId = Math.max(sourceAccountId, destAccountId);

Account firstLocked = accountRepository.findByIdForUpdate(firstId).orElseThrow(...);
Account secondLocked = accountRepository.findByIdForUpdate(secondId).orElseThrow(...);
```
- Sender balance is debited: `source.setBalance(source.getBalance().subtract(amount))`
- Recipient balance is credited: `dest.setBalance(dest.getBalance().add(amount))`
- Creates `DEBIT` ledger entry for source account.
- Creates `CREDIT` ledger entry for destination account.
- **Double-Entry Invariant:** `debitEntry.getAmount().compareTo(creditEntry.getAmount()) == 0`.

---

## 5. User Roles and Access Matrix

| Feature / Endpoint | ADMIN | AUDITOR | ACCOUNT_HOLDER |
|---|:---:|:---:|:---:|
| User Registration & Login | ✓ | ✓ | ✓ |
| View Personal Accounts & Balance | ✓ | ✗ | ✓ |
| Deposit Funds (Authorized Sandbox) | ✓ | ✗ | ✓ |
| Withdraw Funds | ✗ | ✗ | ✓ |
| Transfer Funds to Another Account | ✗ | ✗ | ✓ |
| View Personal Transaction History | ✓ | ✗ | ✓ |
| Download Transaction Receipts | ✓ | ✓ | ✓ |
| Approve / Reject Account Applications | ✓ | ✗ | ✗ |
| Activate / Freeze / Close Accounts | ✓ | ✗ | ✗ |
| Manage User Statuses (Active/Suspended)| ✓ | ✗ | ✗ |
| Inspect All Transactions Across System| ✓ | ✓ (Read-only) | ✗ |
| Inspect Double-Entry Ledger Records | ✓ | ✓ (Read-only) | ✗ |
| Run Ledger Balance Reconciliation | ✓ | ✓ (Read-only) | ✗ |
| View System Audit Logs | ✓ | ✓ (Read-only) | ✗ |

---

## 6. Seed Data & Demo Accounts

Development seed data is populated automatically via Flyway migration `V9__seed_data.sql`:

| Role | Email | Password | Pre-seeded Accounts |
|---|---|---|---|
| **Administrator** | `admin@ledgerline.com` | `Admin@123` | Platform oversight |
| **Auditor** | `auditor@ledgerline.com` | `Auditor@123` | Read-only ledger audit |
| **Customer 1** | `rahul@example.com` | `Customer1@123` | `ACC1000000001` (₹50,000.00)<br>`ACC1000000002` (₹100,000.00) |
| **Customer 2** | `priya@example.com` | `Customer2@123` | `ACC1000000003` (₹75,000.00) |

*Note: All passwords are encrypted with BCrypt (`$2a$10$...`).*

---

## 7. Windows Setup & Execution Guide

### Prerequisites
- Java 21 LTS installed (`java -version`)
- Maven 3.9+ installed (`mvn -version`)
- Node.js 18+ & npm installed (`node -version`)
- PostgreSQL 15+ running on `localhost:5432` with database `ledgerline_db`

### Step 1: PostgreSQL Database Setup
Open `psql` or pgAdmin:
```sql
CREATE DATABASE ledgerline_db;
```

### Step 2: Start the Backend (Spring Boot)
Open a Windows Command Prompt (CMD) or PowerShell:
```cmd
cd /d "c:\Users\Mahadev\OneDrive\Documents\PROJECTGITUP\backend\ledgerline"
set "DB_PASSWORD=YOUR_POSTGRESQL_PASSWORD"
mvn spring-boot:run
```
- Backend starts at: **http://localhost:8081**
- Health API: **http://localhost:8081/api/health**
- Swagger OpenAPI Documentation: **http://localhost:8081/swagger-ui/index.html**

### Step 3: Start the Frontend (React + Vite)
Open a separate Windows Command Prompt (CMD) or PowerShell:
```cmd
cd /d "c:\Users\Mahadev\OneDrive\Documents\PROJECTGITUP\frontend"
npm run dev
```
- Frontend application starts at: **http://localhost:5173**

---

## 8. Automated Testing

To run the automated unit and financial invariant tests:
```cmd
cd /d "c:\Users\Mahadev\OneDrive\Documents\PROJECTGITUP\backend\ledgerline"
mvn test "-Dtest=TransactionServiceTest,DoubleEntryLedgerTest,AuthServiceTest"
```

### Test Coverage Highlights:
- `TransactionServiceTest.java`:
  - `testDeposit_Success`: Balance increment and credit ledger entry creation
  - `testDeposit_NonPositiveAmount_ThrowsException`: Input validation
  - `testDeposit_InactiveAccount_ThrowsException`: Account status guard
  - `testWithdrawal_Success`: Balance deduction and debit ledger entry creation
  - `testWithdrawal_InsufficientBalance_ThrowsException`: Overdraft prevention
  - `testWithdrawal_UnauthorizedUser_ThrowsException`: Account ownership verification
  - `testTransfer_Success`: Deterministic locking, atomic balance changes, debit-credit equality
  - `testTransfer_SameAccount_ThrowsException`: Self-transfer rejection
  - `testTransfer_InsufficientBalance_ThrowsException`: Sender balance guard
- `DoubleEntryLedgerTest.java`:
  - `testReconcileAccount_Balanced`: Proves `Book Balance == Net Ledger Movements`
  - `testReconcileAccount_DiscrepancyDetected`: Mathematical detection of balance tampering
- `AuthServiceTest.java`:
  - Customer registration, duplicate email rejection, BCrypt authentication, JWT generation

---

## 9. Security & Hardening Features

- **No Float / Double Types for Money:** All currency amounts use `BigDecimal` with 4 decimal places in Java and `NUMERIC(19,4)` in PostgreSQL.
- **Append-Only Triggers:** Database triggers prevent any `UPDATE` or `DELETE` on `ledger_entries` and `audit_logs`.
- **Stateless JWTs:** Access tokens signed using HMAC-SHA256 (`HS256`) with configurable expiration.
- **Row-Level Security:** Strict checks ensure customers can never access or transfer funds from another user's account.
- **CORS Restrictions:** Configured to whitelist only authorized frontend origins (`http://localhost:5173`).

