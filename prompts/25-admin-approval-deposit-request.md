# Requirement Prompt 25: Admin Approval-Based Deposit Request System

## Overview
Implement an end-to-end deposit request and administrator approval workflow ensuring zero automatic balances, strict manual monetary input, pessimistic row-level locking, and immutable audit logging.

## Core Directives
1. **Zero Automatic Credits**: A submitted deposit request MUST remain `PENDING` and must NEVER increase account balance upon submission.
2. **Dual Verification**: Funds are credited ONLY when an authenticated administrator reviews the request and clicks Approve.
3. **Pessimistic Locking**: Concurrent approvals on the same account or request are blocked using PostgreSQL `SELECT ... FOR UPDATE`.
4. **Double-Entry Bookkeeping**: Approval generates a `DEPOSIT` transaction and matching `CREDIT` ledger entry where double-entry equality holds.
5. **Rejection Safeguard**: Rejection requires a mandatory reason, marks the request `REJECTED`, and leaves balances untouched.
6. **Data Privacy**: Remitter bank account numbers must always be masked as `XXXXXX1234`. No PINs, passwords, OTPs, or CVVs are ever requested or stored.

## Detailed Sections
- **Section A**: Customer Deposit Request Form
- **Section B**: Deposit Request Submission & Reference Generation (`DEP-REQ-...`)
- **Section C**: Admin Deposit Requests Management Dashboard
- **Section D**: Atomic Admin Approval Workflow
- **Section E**: Admin Rejection Workflow with Reason Tracking
- **Section F**: Customer Deposit Status Tracking (`PENDING`, `APPROVED`, `REJECTED`, `FAILED`)
- **Section G**: Database Schema (`deposit_requests` table with foreign keys & check constraints)
- **Section H**: REST API Endpoints (`/api/deposits/**` and `/api/admin/deposits/**`)
- **Section I**: Financial Security & Idempotency Rules
- **Section J**: Acceptance Testing Invariants

