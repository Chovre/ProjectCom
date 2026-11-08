package com.ledgerline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerline.dto.DepositRequest;
import com.ledgerline.dto.TransactionResponse;
import com.ledgerline.dto.TransferRequest;
import com.ledgerline.dto.WithdrawalRequest;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.entity.Transaction;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.AccountStatus;
import com.ledgerline.entity.enums.EntryType;
import com.ledgerline.entity.enums.TransactionStatus;
import com.ledgerline.entity.enums.TransactionType;
import com.ledgerline.entity.enums.UserRole;
import com.ledgerline.exception.*;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.LedgerEntryRepository;
import com.ledgerline.repository.TransactionRepository;
import com.ledgerline.repository.UserRepository;
import com.ledgerline.specification.TransactionSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * DEPOSIT: Deposits funds into an active account atomically.
     * Records a CREDIT ledger entry and audit trail.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse deposit(DepositRequest request, Long userId, String idempotencyKey, String ipAddress) {
        String fingerprint = idempotencyService.generateFingerprint(request);
        Optional<String> cached = idempotencyService.checkOrCreate(idempotencyKey, userId, "DEPOSIT", fingerprint);
        if (cached.isPresent()) {
            try {
                return objectMapper.readValue(cached.get(), TransactionResponse.class);
            } catch (Exception e) {
                log.warn("Failed to parse cached response, proceeding with execution", e);
            }
        }

        try {
            BigDecimal amount = validatePositiveAmount(request.getAmount());

            // Acquire pessimistic write lock on the target account
            Account account = accountRepository.findByIdForUpdate(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + request.getAccountId()));

            // Verify ownership or admin privilege
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
            if (!account.getUser().getId().equals(userId) && user.getRole() != UserRole.ADMIN) {
                throw new UnauthorizedAccessException("You are not authorized to deposit into this account");
            }

            if (account.getStatus() != AccountStatus.ACTIVE) {
                throw new AccountNotActiveException("Cannot deposit into account with status: " + account.getStatus());
            }

            // Update account balance
            BigDecimal newBalance = account.getBalance().add(amount);
            account.setBalance(newBalance);
            accountRepository.save(account);

            // Record transaction
            String ref = generateReferenceNumber("DEP");
            Transaction transaction = Transaction.builder()
                    .referenceNumber(ref)
                    .idempotencyKey(idempotencyKey)
                    .transactionType(TransactionType.DEPOSIT)
                    .destinationAccount(account)
                    .amount(amount)
                    .currency(account.getCurrency())
                    .status(TransactionStatus.SUCCESS)
                    .description(request.getDescription() != null ? request.getDescription() : "Authorized Sandbox Deposit")
                    .completedAt(LocalDateTime.now())
                    .build();
            Transaction savedTxn = transactionRepository.save(transaction);

            // Record double-entry CREDIT ledger entry
            LedgerEntry creditEntry = LedgerEntry.builder()
                    .transaction(savedTxn)
                    .account(account)
                    .entryType(EntryType.CREDIT)
                    .amount(amount)
                    .currency(account.getCurrency())
                    .build();
            ledgerEntryRepository.save(creditEntry);

            // Audit logging
            auditService.log(userId, "TRANSACTION_DEPOSIT", "TRANSACTION",
                    savedTxn.getReferenceNumber(),
                    "Deposit of " + amount + " " + account.getCurrency() + " to account " + account.getAccountNumber(), ipAddress);

            TransactionResponse response = mapToResponse(savedTxn);
            idempotencyService.markCompleted(idempotencyKey, userId, response);
            return response;

        } catch (Exception ex) {
            idempotencyService.markFailed(idempotencyKey, userId);
            throw ex;
        }
    }

    /**
     * WITHDRAWAL: Debits funds from an active account with concurrency lock.
     * Guaranteed negative balance prevention via pessimistic lock + validation.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse withdraw(WithdrawalRequest request, Long userId, String idempotencyKey, String ipAddress) {
        String fingerprint = idempotencyService.generateFingerprint(request);
        Optional<String> cached = idempotencyService.checkOrCreate(idempotencyKey, userId, "WITHDRAWAL", fingerprint);
        if (cached.isPresent()) {
            try {
                return objectMapper.readValue(cached.get(), TransactionResponse.class);
            } catch (Exception e) {
                log.warn("Failed to parse cached response, proceeding with execution", e);
            }
        }

        try {
            BigDecimal amount = validatePositiveAmount(request.getAmount());

            // Acquire row-level pessimistic write lock (SELECT FOR UPDATE)
            Account account = accountRepository.findByIdForUpdate(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + request.getAccountId()));

            // Verify account ownership
            if (!account.getUser().getId().equals(userId)) {
                throw new UnauthorizedAccessException("You are not authorized to withdraw from this account");
            }

            if (account.getStatus() != AccountStatus.ACTIVE) {
                throw new AccountNotActiveException("Cannot withdraw from account with status: " + account.getStatus());
            }

            // Verify sufficient funds
            if (account.getBalance().compareTo(amount) < 0) {
                throw new InsufficientBalanceException("Insufficient funds. Available: ₹" +
                        account.getBalance().setScale(2, RoundingMode.HALF_UP) +
                        ", Requested: ₹" + amount.setScale(2, RoundingMode.HALF_UP));
            }

            // Deduct balance
            BigDecimal newBalance = account.getBalance().subtract(amount);
            account.setBalance(newBalance);
            accountRepository.save(account);

            // Create Transaction
            String ref = generateReferenceNumber("WTH");
            Transaction transaction = Transaction.builder()
                    .referenceNumber(ref)
                    .idempotencyKey(idempotencyKey)
                    .transactionType(TransactionType.WITHDRAWAL)
                    .sourceAccount(account)
                    .amount(amount)
                    .currency(account.getCurrency())
                    .status(TransactionStatus.SUCCESS)
                    .description(request.getDescription() != null ? request.getDescription() : "Cash Withdrawal")
                    .completedAt(LocalDateTime.now())
                    .build();
            Transaction savedTxn = transactionRepository.save(transaction);

            // Record DEBIT ledger entry
            LedgerEntry debitEntry = LedgerEntry.builder()
                    .transaction(savedTxn)
                    .account(account)
                    .entryType(EntryType.DEBIT)
                    .amount(amount)
                    .currency(account.getCurrency())
                    .build();
            ledgerEntryRepository.save(debitEntry);

            // Audit
            auditService.log(userId, "TRANSACTION_WITHDRAWAL", "TRANSACTION",
                    savedTxn.getReferenceNumber(),
                    "Withdrawal of " + amount + " " + account.getCurrency() + " from account " + account.getAccountNumber(), ipAddress);

            TransactionResponse response = mapToResponse(savedTxn);
            idempotencyService.markCompleted(idempotencyKey, userId, response);
            return response;

        } catch (Exception ex) {
            idempotencyService.markFailed(idempotencyKey, userId);
            throw ex;
        }
    }

    /**
     * TRANSFER: Atomically transfers funds between two accounts.
     * Deadlock-free: locks both accounts in deterministic order (smaller account ID first).
     * Creates balanced DEBIT (sender) and CREDIT (recipient) ledger entries.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse transfer(TransferRequest request, Long userId, String idempotencyKey, String ipAddress) {
        String fingerprint = idempotencyService.generateFingerprint(request);
        Optional<String> cached = idempotencyService.checkOrCreate(idempotencyKey, userId, "TRANSFER", fingerprint);
        if (cached.isPresent()) {
            try {
                return objectMapper.readValue(cached.get(), TransactionResponse.class);
            } catch (Exception e) {
                log.warn("Failed to parse cached response, proceeding with execution", e);
            }
        }

        try {
            BigDecimal amount = validatePositiveAmount(request.getAmount());

            // Find destination account by account number first (without lock)
            Account destLookup = accountRepository.findByAccountNumber(request.getDestinationAccountNumber().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination account not found: " + request.getDestinationAccountNumber()));

            Long sourceId = request.getSourceAccountId();
            Long destId = destLookup.getId();

            if (sourceId.equals(destId)) {
                throw new InvalidTransactionException("Source and destination accounts must be different");
            }

            // DETERMINISTIC LOCKING: Lock smaller ID first to prevent deadlocks
            Long firstId = Math.min(sourceId, destId);
            Long secondId = Math.max(sourceId, destId);

            Account firstLocked = accountRepository.findByIdForUpdate(firstId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + firstId));
            Account secondLocked = accountRepository.findByIdForUpdate(secondId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + secondId));

            Account sourceAccount = firstLocked.getId().equals(sourceId) ? firstLocked : secondLocked;
            Account destAccount = firstLocked.getId().equals(destId) ? firstLocked : secondLocked;

            // Verify sender ownership
            if (!sourceAccount.getUser().getId().equals(userId)) {
                throw new UnauthorizedAccessException("You are not authorized to transfer from account: " + sourceAccount.getAccountNumber());
            }

            // Verify statuses
            if (sourceAccount.getStatus() != AccountStatus.ACTIVE) {
                throw new AccountNotActiveException("Source account is not active: " + sourceAccount.getStatus());
            }
            if (destAccount.getStatus() != AccountStatus.ACTIVE) {
                throw new AccountNotActiveException("Destination account is not active: " + destAccount.getStatus());
            }

            // Verify currency match
            if (!sourceAccount.getCurrency().equalsIgnoreCase(destAccount.getCurrency())) {
                throw new InvalidTransactionException("Cross-currency transfers are not supported. Source: "
                        + sourceAccount.getCurrency() + ", Dest: " + destAccount.getCurrency());
            }

            // Check sufficient funds
            if (sourceAccount.getBalance().compareTo(amount) < 0) {
                throw new InsufficientBalanceException("Insufficient funds for transfer. Available: ₹" +
                        sourceAccount.getBalance().setScale(2, RoundingMode.HALF_UP) +
                        ", Required: ₹" + amount.setScale(2, RoundingMode.HALF_UP));
            }

            // Update balances atomically
            sourceAccount.setBalance(sourceAccount.getBalance().subtract(amount));
            destAccount.setBalance(destAccount.getBalance().add(amount));

            accountRepository.save(sourceAccount);
            accountRepository.save(destAccount);

            // Record transaction
            String ref = generateReferenceNumber("TRF");
            Transaction transaction = Transaction.builder()
                    .referenceNumber(ref)
                    .idempotencyKey(idempotencyKey)
                    .transactionType(TransactionType.TRANSFER)
                    .sourceAccount(sourceAccount)
                    .destinationAccount(destAccount)
                    .amount(amount)
                    .currency(sourceAccount.getCurrency())
                    .status(TransactionStatus.SUCCESS)
                    .description(request.getDescription() != null ? request.getDescription() : "Money Transfer")
                    .completedAt(LocalDateTime.now())
                    .build();
            Transaction savedTxn = transactionRepository.save(transaction);

            // Create balanced double-entry ledger entries
            LedgerEntry debitEntry = LedgerEntry.builder()
                    .transaction(savedTxn)
                    .account(sourceAccount)
                    .entryType(EntryType.DEBIT)
                    .amount(amount)
                    .currency(sourceAccount.getCurrency())
                    .build();

            LedgerEntry creditEntry = LedgerEntry.builder()
                    .transaction(savedTxn)
                    .account(destAccount)
                    .entryType(EntryType.CREDIT)
                    .amount(amount)
                    .currency(destAccount.getCurrency())
                    .build();

            ledgerEntryRepository.save(debitEntry);
            ledgerEntryRepository.save(creditEntry);

            // Double entry money conservation invariant assertion
            if (debitEntry.getAmount().compareTo(creditEntry.getAmount()) != 0) {
                throw new IllegalStateException("Double-entry invariant violated: debit amount does not match credit amount");
            }

            // Audit
            auditService.log(userId, "TRANSACTION_TRANSFER", "TRANSACTION",
                    savedTxn.getReferenceNumber(),
                    "Transfer of " + amount + " " + sourceAccount.getCurrency() + " from "
                            + sourceAccount.getAccountNumber() + " to " + destAccount.getAccountNumber(), ipAddress);

            TransactionResponse response = mapToResponse(savedTxn);
            idempotencyService.markCompleted(idempotencyKey, userId, response);
            return response;

        } catch (Exception ex) {
            idempotencyService.markFailed(idempotencyKey, userId);
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getMyTransactions(Long userId, String type, String status,
                                                       LocalDateTime startDate, LocalDateTime endDate,
                                                       Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        TransactionType txnType = (type != null && !type.isBlank()) ? TransactionType.valueOf(type.toUpperCase()) : null;
        TransactionStatus txnStatus = (status != null && !status.isBlank()) ? TransactionStatus.valueOf(status.toUpperCase()) : null;

        Specification<Transaction> spec = Specification.where(TransactionSpecification.forUser(user))
                .and(TransactionSpecification.withType(txnType))
                .and(TransactionSpecification.withStatus(txnStatus))
                .and(TransactionSpecification.createdBetween(startDate, endDate));

        return transactionRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionByReference(String reference, Long userId) {
        Transaction txn = transactionRepository.findByReferenceNumber(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + reference));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (user.getRole() == UserRole.ACCOUNT_HOLDER) {
            boolean isSourceOwner = txn.getSourceAccount() != null && txn.getSourceAccount().getUser().getId().equals(userId);
            boolean isDestOwner = txn.getDestinationAccount() != null && txn.getDestinationAccount().getUser().getId().equals(userId);
            if (!isSourceOwner && !isDestOwner) {
                throw new UnauthorizedAccessException("You are not authorized to view this transaction");
            }
        }

        return mapToResponse(txn);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getAllTransactions(String type, String status,
                                                        LocalDateTime startDate, LocalDateTime endDate,
                                                        Pageable pageable) {
        TransactionType txnType = (type != null && !type.isBlank()) ? TransactionType.valueOf(type.toUpperCase()) : null;
        TransactionStatus txnStatus = (status != null && !status.isBlank()) ? TransactionStatus.valueOf(status.toUpperCase()) : null;

        Specification<Transaction> spec = Specification.where(TransactionSpecification.withType(txnType))
                .and(TransactionSpecification.withStatus(txnStatus))
                .and(TransactionSpecification.createdBetween(startDate, endDate));

        return transactionRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    private BigDecimal validatePositiveAmount(BigDecimal amount) {
        if (amount == null) {
            throw new InvalidTransactionException("Transaction amount is required and cannot be null");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Transaction amount must be strictly greater than zero");
        }
        if (amount.scale() > 2) {
            throw new InvalidTransactionException("Transaction amount cannot have more than 2 decimal places");
        }
        return amount.setScale(4, RoundingMode.UNNECESSARY);
    }

    private String generateReferenceNumber(String prefix) {
        long timestamp = System.currentTimeMillis();
        int rand = secureRandom.nextInt(90000) + 10000;
        return prefix + "-" + timestamp + "-" + rand;
    }

    public TransactionResponse mapToResponse(Transaction txn) {
        return TransactionResponse.builder()
                .id(txn.getId())
                .referenceNumber(txn.getReferenceNumber())
                .transactionType(txn.getTransactionType().name())
                .sourceAccountNumber(txn.getSourceAccount() != null ? txn.getSourceAccount().getAccountNumber() : null)
                .destinationAccountNumber(txn.getDestinationAccount() != null ? txn.getDestinationAccount().getAccountNumber() : null)
                .amount(txn.getAmount())
                .currency(txn.getCurrency())
                .status(txn.getStatus().name())
                .description(txn.getDescription())
                .createdAt(txn.getCreatedAt())
                .completedAt(txn.getCompletedAt())
                .build();
    }
}

