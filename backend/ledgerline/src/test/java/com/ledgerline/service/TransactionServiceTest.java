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
import com.ledgerline.entity.enums.UserStatus;
import com.ledgerline.exception.AccountNotActiveException;
import com.ledgerline.exception.InsufficientBalanceException;
import com.ledgerline.exception.InvalidTransactionException;
import com.ledgerline.exception.UnauthorizedAccessException;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.LedgerEntryRepository;
import com.ledgerline.repository.TransactionRepository;
import com.ledgerline.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private LedgerEntryRepository ledgerEntryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private IdempotencyService idempotencyService;

    @InjectMocks
    private TransactionService transactionService;

    private User testUser;
    private Account sourceAccount;
    private Account destinationAccount;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .fullName("Rahul Sharma")
                .email("rahul@example.com")
                .role(UserRole.ACCOUNT_HOLDER)
                .status(UserStatus.ACTIVE)
                .build();

        sourceAccount = Account.builder()
                .id(10L)
                .accountNumber("ACC1000000001")
                .user(testUser)
                .balance(new BigDecimal("10000.0000"))
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();

        User recipientUser = User.builder()
                .id(2L)
                .fullName("Priya Patel")
                .email("priya@example.com")
                .role(UserRole.ACCOUNT_HOLDER)
                .status(UserStatus.ACTIVE)
                .build();

        destinationAccount = Account.builder()
                .id(20L)
                .accountNumber("ACC1000000002")
                .user(recipientUser)
                .balance(new BigDecimal("5000.0000"))
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();

        when(idempotencyService.generateFingerprint(any())).thenReturn("sample-fingerprint");
        when(idempotencyService.checkOrCreate(any(), any(), any(), any())).thenReturn(Optional.empty());
    }

    @Test
    @DisplayName("Deposit: Valid deposit increases balance and creates credit ledger entry")
    void testDeposit_Success() {
        DepositRequest request = DepositRequest.builder()
                .accountId(10L)
                .amount(new BigDecimal("2000.00"))
                .description("Salary deposit")
                .build();

        when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(sourceAccount));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> {
            Transaction t = i.getArgument(0);
            t.setId(101L);
            t.setCreatedAt(LocalDateTime.now());
            return t;
        });

        TransactionResponse response = transactionService.deposit(request, 1L, "DEP-KEY-1", "127.0.0.1");

        assertNotNull(response);
        assertEquals(TransactionStatus.SUCCESS.name(), response.getStatus());
        assertEquals(new BigDecimal("2000.0000"), response.getAmount());
        assertEquals(new BigDecimal("12000.0000"), sourceAccount.getBalance());

        // Verify CREDIT ledger entry created
        ArgumentCaptor<LedgerEntry> captor = ArgumentCaptor.forClass(LedgerEntry.class);
        verify(ledgerEntryRepository).save(captor.capture());
        LedgerEntry entry = captor.getValue();
        assertEquals(EntryType.CREDIT, entry.getEntryType());
        assertEquals(new BigDecimal("2000.0000"), entry.getAmount());
        assertEquals(sourceAccount, entry.getAccount());

        verify(idempotencyService).markCompleted(eq("DEP-KEY-1"), eq(1L), any());
    }

    @Test
    @DisplayName("Deposit: Non-positive amount throws InvalidTransactionException")
    void testDeposit_NonPositiveAmount_ThrowsException() {
        DepositRequest request = DepositRequest.builder()
                .accountId(10L)
                .amount(new BigDecimal("0.00"))
                .build();

        assertThrows(InvalidTransactionException.class, () ->
                transactionService.deposit(request, 1L, "DEP-KEY-2", "127.0.0.1"));
    }

    @Test
    @DisplayName("Deposit: Inactive account deposit throws AccountNotActiveException")
    void testDeposit_InactiveAccount_ThrowsException() {
        sourceAccount.setStatus(AccountStatus.FROZEN);
        DepositRequest request = DepositRequest.builder()
                .accountId(10L)
                .amount(new BigDecimal("100.00"))
                .build();

        when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(sourceAccount));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThrows(AccountNotActiveException.class, () ->
                transactionService.deposit(request, 1L, "DEP-KEY-3", "127.0.0.1"));
    }

    @Test
    @DisplayName("Withdrawal: Valid withdrawal deducts balance and creates debit ledger entry")
    void testWithdrawal_Success() {
        WithdrawalRequest request = WithdrawalRequest.builder()
                .accountId(10L)
                .amount(new BigDecimal("3000.00"))
                .description("ATM withdrawal")
                .build();

        when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(sourceAccount));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> {
            Transaction t = i.getArgument(0);
            t.setId(102L);
            t.setCreatedAt(LocalDateTime.now());
            return t;
        });

        TransactionResponse response = transactionService.withdraw(request, 1L, "WTH-KEY-1", "127.0.0.1");

        assertNotNull(response);
        assertEquals(TransactionStatus.SUCCESS.name(), response.getStatus());
        assertEquals(new BigDecimal("7000.0000"), sourceAccount.getBalance());

        // Verify DEBIT ledger entry created
        ArgumentCaptor<LedgerEntry> captor = ArgumentCaptor.forClass(LedgerEntry.class);
        verify(ledgerEntryRepository).save(captor.capture());
        LedgerEntry entry = captor.getValue();
        assertEquals(EntryType.DEBIT, entry.getEntryType());
        assertEquals(new BigDecimal("3000.0000"), entry.getAmount());
    }

    @Test
    @DisplayName("Withdrawal: Insufficient balance throws InsufficientBalanceException and prevents negative balance")
    void testWithdrawal_InsufficientBalance_ThrowsException() {
        WithdrawalRequest request = WithdrawalRequest.builder()
                .accountId(10L)
                .amount(new BigDecimal("15000.00")) // Exceeds balance of 10000
                .build();

        when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(sourceAccount));

        assertThrows(InsufficientBalanceException.class, () ->
                transactionService.withdraw(request, 1L, "WTH-KEY-2", "127.0.0.1"));

        // Balance must remain unchanged
        assertEquals(new BigDecimal("10000.0000"), sourceAccount.getBalance());
        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Withdrawal: Unauthorized user throws UnauthorizedAccessException")
    void testWithdrawal_UnauthorizedUser_ThrowsException() {
        WithdrawalRequest request = WithdrawalRequest.builder()
                .accountId(10L)
                .amount(new BigDecimal("500.00"))
                .build();

        when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(sourceAccount));

        // Different user ID (99L != 1L)
        assertThrows(UnauthorizedAccessException.class, () ->
                transactionService.withdraw(request, 99L, "WTH-KEY-3", "127.0.0.1"));
    }

    @Test
    @DisplayName("Transfer: Valid transfer debits sender, credits recipient, and creates balanced entries")
    void testTransfer_Success() {
        TransferRequest request = TransferRequest.builder()
                .sourceAccountId(10L)
                .destinationAccountNumber("ACC1000000002")
                .amount(new BigDecimal("2500.00"))
                .description("Rent transfer")
                .build();

        when(accountRepository.findByAccountNumber("ACC1000000002")).thenReturn(Optional.of(destinationAccount));
        when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(sourceAccount));
        when(accountRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(destinationAccount));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> {
            Transaction t = i.getArgument(0);
            t.setId(103L);
            t.setCreatedAt(LocalDateTime.now());
            return t;
        });

        TransactionResponse response = transactionService.transfer(request, 1L, "TRF-KEY-1", "127.0.0.1");

        assertNotNull(response);
        assertEquals(TransactionStatus.SUCCESS.name(), response.getStatus());

        // Sender deducted: 10000 - 2500 = 7500
        assertEquals(new BigDecimal("7500.0000"), sourceAccount.getBalance());
        // Recipient credited: 5000 + 2500 = 7500
        assertEquals(new BigDecimal("7500.0000"), destinationAccount.getBalance());

        // Verify two balanced ledger entries (DEBIT and CREDIT)
        ArgumentCaptor<LedgerEntry> captor = ArgumentCaptor.forClass(LedgerEntry.class);
        verify(ledgerEntryRepository, times(2)).save(captor.capture());

        var entries = captor.getAllValues();
        assertEquals(2, entries.size());

        LedgerEntry debit = entries.get(0);
        assertEquals(EntryType.DEBIT, debit.getEntryType());
        assertEquals(sourceAccount, debit.getAccount());
        assertEquals(new BigDecimal("2500.0000"), debit.getAmount());

        LedgerEntry credit = entries.get(1);
        assertEquals(EntryType.CREDIT, credit.getEntryType());
        assertEquals(destinationAccount, credit.getAccount());
        assertEquals(new BigDecimal("2500.0000"), credit.getAmount());

        // Double-entry accounting invariant: total debit == total credit
        assertEquals(debit.getAmount(), credit.getAmount());
    }

    @Test
    @DisplayName("Transfer: Same account transfer is rejected")
    void testTransfer_SameAccount_ThrowsException() {
        TransferRequest request = TransferRequest.builder()
                .sourceAccountId(10L)
                .destinationAccountNumber("ACC1000000001") // Same as source account
                .amount(new BigDecimal("500.00"))
                .build();

        when(accountRepository.findByAccountNumber("ACC1000000001")).thenReturn(Optional.of(sourceAccount));

        assertThrows(InvalidTransactionException.class, () ->
                transactionService.transfer(request, 1L, "TRF-KEY-2", "127.0.0.1"));
    }

    @Test
    @DisplayName("Transfer: Insufficient balance on sender account throws InsufficientBalanceException")
    void testTransfer_InsufficientBalance_ThrowsException() {
        TransferRequest request = TransferRequest.builder()
                .sourceAccountId(10L)
                .destinationAccountNumber("ACC1000000002")
                .amount(new BigDecimal("20000.00")) // Exceeds 10000
                .build();

        when(accountRepository.findByAccountNumber("ACC1000000002")).thenReturn(Optional.of(destinationAccount));
        when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(sourceAccount));
        when(accountRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(destinationAccount));

        assertThrows(InsufficientBalanceException.class, () ->
                transactionService.transfer(request, 1L, "TRF-KEY-3", "127.0.0.1"));

        assertEquals(new BigDecimal("10000.0000"), sourceAccount.getBalance());
        assertEquals(new BigDecimal("5000.0000"), destinationAccount.getBalance());
        verify(ledgerEntryRepository, never()).save(any());
    }
}

