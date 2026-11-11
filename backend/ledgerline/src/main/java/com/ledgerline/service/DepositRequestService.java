package com.ledgerline.service;

import com.ledgerline.dto.*;
import com.ledgerline.entity.*;
import com.ledgerline.entity.DepositRequest;
import com.ledgerline.entity.enums.*;
import com.ledgerline.exception.*;
import com.ledgerline.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepositRequestService {

    private final DepositRequestRepository depositRequestRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final AuditService auditService;

    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Customer submits a deposit request.
     * Balance is strictly NOT updated. Request stays PENDING awaiting admin approval.
     */
    @Transactional
    public DepositRequestResponse createDepositRequest(CreateDepositRequestDto dto, Long currentUserId, String ipAddress) {
        log.info("Processing deposit request submission from user ID {} for account ID {}", currentUserId, dto.getAccountId());

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserId));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedAccessException("Your account profile is currently " + user.getStatus());
        }

        Account account = accountRepository.findById(dto.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + dto.getAccountId()));

        if (!account.getUser().getId().equals(currentUserId) && user.getRole() != UserRole.ADMIN) {
            throw new UnauthorizedAccessException("You are not authorized to request a deposit into account: " + account.getAccountNumber());
        }

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new AccountNotActiveException("Cannot request deposit for account with status: " + account.getStatus());
        }

        BigDecimal amount = dto.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Deposit amount must be strictly greater than zero");
        }

        // Mask bank account number if provided
        String maskedBankAcc = null;
        if (dto.getBankAccountNumber() != null && !dto.getBankAccountNumber().isBlank()) {
            String raw = dto.getBankAccountNumber().trim();
            if (raw.length() > 4) {
                maskedBankAcc = "XXXXXX" + raw.substring(raw.length() - 4);
            } else {
                maskedBankAcc = "XXXX" + raw;
            }
        }

        String requestRef = generateRequestReference();

        DepositRequest request = DepositRequest.builder()
                .requestReference(requestRef)
                .user(user)
                .account(account)
                .bankName(dto.getBankName() != null ? dto.getBankName().trim() : null)
                .bankAccountNumber(maskedBankAcc)
                .ifscCode(dto.getIfscCode() != null ? dto.getIfscCode().trim().toUpperCase() : null)
                .sourceAccountHolder(dto.getSourceAccountHolder() != null ? dto.getSourceAccountHolder().trim() : user.getFullName())
                .amount(amount)
                .currency(account.getCurrency() != null ? account.getCurrency() : "INR")
                .paymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod().trim().toUpperCase() : "BANK_TRANSFER")
                .transactionReference(dto.getTransactionReference() != null ? dto.getTransactionReference().trim() : null)
                .paymentProofPath(dto.getPaymentProofPath() != null ? dto.getPaymentProofPath().trim() : null)
                .description(dto.getDescription() != null ? dto.getDescription().trim() : null)
                .status(DepositRequestStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .build();

        DepositRequest saved = depositRequestRepository.save(request);

        auditService.log(
                currentUserId,
                "DEPOSIT_REQUEST_SUBMITTED",
                "DEPOSIT_REQUEST",
                saved.getRequestReference(),
                "Deposit request of " + amount + " " + saved.getCurrency() + " submitted for account " + account.getAccountNumber() + " (Pending Admin Approval)",
                ipAddress
        );

        log.info("Deposit request {} created successfully for user {}", saved.getRequestReference(), currentUserId);
        return mapToResponse(saved);
    }

    /**
     * Get all deposit requests for the authenticated customer.
     */
    @Transactional(readOnly = true)
    public Page<DepositRequestResponse> getMyRequests(Long currentUserId, Pageable pageable) {
        return depositRequestRepository.findByUserIdOrderBySubmittedAtDesc(currentUserId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get single deposit request by ID with ownership enforcement.
     */
    @Transactional(readOnly = true)
    public DepositRequestResponse getRequestById(Long id, Long currentUserId, boolean isAdmin) {
        DepositRequest request = depositRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deposit request not found with ID: " + id));

        if (!isAdmin && !request.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedAccessException("You are not authorized to view this deposit request");
        }

        return mapToResponse(request);
    }

    /**
     * Admin: Get all pending deposit requests.
     */
    @Transactional(readOnly = true)
    public Page<DepositRequestResponse> getPendingRequests(Pageable pageable) {
        return depositRequestRepository.findByStatusOrderBySubmittedAtDesc(DepositRequestStatus.PENDING, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Admin: Get all deposit requests with optional status filtering.
     */
    @Transactional(readOnly = true)
    public Page<DepositRequestResponse> getAllRequests(DepositRequestStatus status, Pageable pageable) {
        if (status != null) {
            return depositRequestRepository.findByStatusOrderBySubmittedAtDesc(status, pageable)
                    .map(this::mapToResponse);
        }
        return depositRequestRepository.findAllByOrderBySubmittedAtDesc(pageable)
                .map(this::mapToResponse);
    }

    /**
     * Admin Approval Processing:
     * 1. Pessimistic lock on deposit request & account
     * 2. Verify status is PENDING
     * 3. Atomically credit customer account
     * 4. Create Transaction record & CREDIT LedgerEntry
     * 5. Set status APPROVED & record audit log
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public DepositRequestResponse approveDepositRequest(Long id, Long adminUserId, ApproveDepositRequestDto dto, String ipAddress) {
        log.info("Admin {} attempting to approve deposit request ID {}", adminUserId, id);

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrator user not found: " + adminUserId));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new UnauthorizedAccessException("Only authorized administrators can approve deposit requests");
        }

        // Lock deposit request to prevent concurrent approval race conditions
        DepositRequest depositRequest = depositRequestRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deposit request not found with ID: " + id));

        if (depositRequest.getStatus() != DepositRequestStatus.PENDING) {
            throw new IllegalStateException("Deposit request is already " + depositRequest.getStatus() + " and cannot be approved.");
        }

        // Lock customer account for update
        Account account = accountRepository.findByIdForUpdate(depositRequest.getAccount().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Target account not found: " + depositRequest.getAccount().getId()));

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new AccountNotActiveException("Cannot credit account with status: " + account.getStatus());
        }

        BigDecimal amount = depositRequest.getAmount();

        // 1. Atomic balance update
        BigDecimal newBalance = account.getBalance().add(amount);
        account.setBalance(newBalance);
        accountRepository.save(account);

        // 2. Create financial Transaction record
        String txnRef = "DEP-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String desc = "Admin Approved Deposit: " + depositRequest.getRequestReference() + " via " + depositRequest.getPaymentMethod();
        if (dto != null && dto.getAdminNotes() != null && !dto.getAdminNotes().isBlank()) {
            desc += " (" + dto.getAdminNotes().trim() + ")";
        }

        Transaction transaction = Transaction.builder()
                .referenceNumber(txnRef)
                .transactionType(TransactionType.DEPOSIT)
                .destinationAccount(account)
                .amount(amount)
                .currency(depositRequest.getCurrency())
                .status(TransactionStatus.SUCCESS)
                .description(desc)
                .completedAt(LocalDateTime.now())
                .build();
        Transaction savedTxn = transactionRepository.save(transaction);

        // 3. Create double-entry CREDIT ledger entry
        LedgerEntry creditEntry = LedgerEntry.builder()
                .transaction(savedTxn)
                .account(account)
                .entryType(EntryType.CREDIT)
                .amount(amount)
                .currency(depositRequest.getCurrency())
                .build();
        ledgerEntryRepository.save(creditEntry);

        // 4. Update DepositRequest entity
        depositRequest.setStatus(DepositRequestStatus.APPROVED);
        depositRequest.setAdmin(admin);
        depositRequest.setAdminNotes(dto != null ? dto.getAdminNotes() : null);
        depositRequest.setTransaction(savedTxn);
        depositRequest.setReviewedAt(LocalDateTime.now());
        DepositRequest updated = depositRequestRepository.save(depositRequest);

        // 5. Immutable Audit Log
        auditService.log(
                adminUserId,
                "DEPOSIT_APPROVED",
                "DEPOSIT_REQUEST",
                updated.getRequestReference(),
                "Approved deposit request " + updated.getRequestReference() + " for ₹" + amount + " credited to account " + account.getAccountNumber() + ". Transaction Ref: " + txnRef,
                ipAddress
        );

        log.info("Deposit request {} approved successfully by admin {}. Credited ₹{} to account {}",
                updated.getRequestReference(), admin.getEmail(), amount, account.getAccountNumber());

        return mapToResponse(updated);
    }

    /**
     * Admin Rejection Processing:
     * 1. Requires mandatory rejection reason
     * 2. Sets status REJECTED
     * 3. Account balance is NOT modified
     * 4. Immutable Audit Log
     */
    @Transactional
    public DepositRequestResponse rejectDepositRequest(Long id, Long adminUserId, RejectDepositRequestDto dto, String ipAddress) {
        log.info("Admin {} attempting to reject deposit request ID {}", adminUserId, id);

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrator user not found: " + adminUserId));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new UnauthorizedAccessException("Only authorized administrators can reject deposit requests");
        }

        DepositRequest depositRequest = depositRequestRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deposit request not found with ID: " + id));

        if (depositRequest.getStatus() != DepositRequestStatus.PENDING) {
            throw new IllegalStateException("Deposit request is already " + depositRequest.getStatus() + " and cannot be rejected.");
        }

        if (dto.getRejectionReason() == null || dto.getRejectionReason().isBlank()) {
            throw new IllegalArgumentException("A valid rejection reason must be provided");
        }

        depositRequest.setStatus(DepositRequestStatus.REJECTED);
        depositRequest.setRejectionReason(dto.getRejectionReason().trim());
        depositRequest.setAdmin(admin);
        depositRequest.setReviewedAt(LocalDateTime.now());
        DepositRequest updated = depositRequestRepository.save(depositRequest);

        auditService.log(
                adminUserId,
                "DEPOSIT_REJECTED",
                "DEPOSIT_REQUEST",
                updated.getRequestReference(),
                "Rejected deposit request " + updated.getRequestReference() + " of ₹" + updated.getAmount() + ". Reason: " + dto.getRejectionReason().trim(),
                ipAddress
        );

        log.info("Deposit request {} rejected by admin {}. Reason: {}",
                updated.getRequestReference(), admin.getEmail(), dto.getRejectionReason());

        return mapToResponse(updated);
    }

    private String generateRequestReference() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int randomPart = 1000 + RANDOM.nextInt(9000);
        return "DEP-REQ-" + timestamp + "-" + randomPart;
    }

    public DepositRequestResponse mapToResponse(DepositRequest entity) {
        return DepositRequestResponse.builder()
                .id(entity.getId())
                .requestReference(entity.getRequestReference())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .customerName(entity.getUser() != null ? entity.getUser().getFullName() : null)
                .customerEmail(entity.getUser() != null ? entity.getUser().getEmail() : null)
                .customerPhone(entity.getUser() != null ? entity.getUser().getPhone() : null)
                .accountId(entity.getAccount() != null ? entity.getAccount().getId() : null)
                .accountNumber(entity.getAccount() != null ? entity.getAccount().getAccountNumber() : null)
                .accountType(entity.getAccount() != null && entity.getAccount().getAccountType() != null ? entity.getAccount().getAccountType().name() : null)
                .bankName(entity.getBankName())
                .bankAccountNumber(entity.getBankAccountNumber())
                .ifscCode(entity.getIfscCode())
                .sourceAccountHolder(entity.getSourceAccountHolder())
                .amount(entity.getAmount())
                .currency(entity.getCurrency())
                .paymentMethod(entity.getPaymentMethod())
                .transactionReference(entity.getTransactionReference())
                .paymentProofPath(entity.getPaymentProofPath())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .rejectionReason(entity.getRejectionReason())
                .adminNotes(entity.getAdminNotes())
                .adminId(entity.getAdmin() != null ? entity.getAdmin().getId() : null)
                .adminName(entity.getAdmin() != null ? entity.getAdmin().getFullName() : null)
                .completedTransactionReference(entity.getTransaction() != null ? entity.getTransaction().getReferenceNumber() : null)
                .submittedAt(entity.getSubmittedAt())
                .reviewedAt(entity.getReviewedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
