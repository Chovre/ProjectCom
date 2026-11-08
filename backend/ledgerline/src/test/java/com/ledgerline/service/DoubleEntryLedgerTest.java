package com.ledgerline.service;

import com.ledgerline.dto.ReconciliationResponse;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.entity.Transaction;
import com.ledgerline.entity.enums.AccountStatus;
import com.ledgerline.entity.enums.EntryType;
import com.ledgerline.entity.enums.TransactionStatus;
import com.ledgerline.entity.enums.TransactionType;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.LedgerEntryRepository;
import com.ledgerline.repository.TransactionRepository;
import com.ledgerline.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoubleEntryLedgerTest {

    @Mock
    private LedgerEntryRepository ledgerEntryRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LedgerService ledgerService;

    @Test
    @DisplayName("Ledger Reconciliation: Balanced account has isReconciled = true and discrepancy = 0")
    void testReconcileAccount_Balanced() {
        Account account = Account.builder()
                .id(1L)
                .accountNumber("ACC1000000001")
                .balance(new BigDecimal("3000.0000"))
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();

        Transaction tx1 = Transaction.builder().id(10L).referenceNumber("DEP-001").build();
        Transaction tx2 = Transaction.builder().id(20L).referenceNumber("WTH-001").build();

        // Initial deposit of 5000 (CREDIT)
        LedgerEntry entry1 = LedgerEntry.builder()
                .id(101L)
                .transaction(tx1)
                .account(account)
                .entryType(EntryType.CREDIT)
                .amount(new BigDecimal("5000.0000"))
                .currency("INR")
                .build();

        // Withdrawal of 2000 (DEBIT)
        LedgerEntry entry2 = LedgerEntry.builder()
                .id(102L)
                .transaction(tx2)
                .account(account)
                .entryType(EntryType.DEBIT)
                .amount(new BigDecimal("2000.0000"))
                .currency("INR")
                .build();

        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(ledgerEntryRepository.findByAccount(account)).thenReturn(List.of(entry1, entry2));

        ReconciliationResponse response = ledgerService.reconcileAccount(1L);

        assertNotNull(response);
        assertEquals("ACC1000000001", response.getAccountNumber());
        // Book balance: 3000
        assertEquals(new BigDecimal("3000.0000"), response.getBookBalance());
        // Ledger balance: 5000 - 2000 = 3000
        assertEquals(new BigDecimal("3000.0000"), response.getLedgerBalance());
        assertTrue(response.isReconciled());
        assertEquals(0, BigDecimal.ZERO.compareTo(response.getDiscrepancy()));
    }

    @Test
    @DisplayName("Ledger Reconciliation: Tampered balance detects discrepancy and flags isReconciled = false")
    void testReconcileAccount_DiscrepancyDetected() {
        Account account = Account.builder()
                .id(2L)
                .accountNumber("ACC1000000002")
                // Book balance was manipulated to 8000 without ledger movement
                .balance(new BigDecimal("8000.0000"))
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();

        Transaction tx = Transaction.builder().id(30L).referenceNumber("DEP-002").build();
        LedgerEntry entry = LedgerEntry.builder()
                .id(103L)
                .transaction(tx)
                .account(account)
                .entryType(EntryType.CREDIT)
                .amount(new BigDecimal("5000.0000"))
                .currency("INR")
                .build();

        when(accountRepository.findById(2L)).thenReturn(Optional.of(account));
        when(ledgerEntryRepository.findByAccount(account)).thenReturn(List.of(entry));

        ReconciliationResponse response = ledgerService.reconcileAccount(2L);

        assertNotNull(response);
        assertFalse(response.isReconciled());
        // Discrepancy = 8000 - 5000 = 3000
        assertEquals(new BigDecimal("3000.0000"), response.getDiscrepancy());
    }
}
