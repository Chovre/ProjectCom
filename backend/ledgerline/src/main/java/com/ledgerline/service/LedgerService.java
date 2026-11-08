package com.ledgerline.service;

import com.ledgerline.dto.LedgerEntryResponse;
import com.ledgerline.dto.ReconciliationResponse;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.EntryType;
import com.ledgerline.entity.enums.UserRole;
import com.ledgerline.exception.ResourceNotFoundException;
import com.ledgerline.exception.UnauthorizedAccessException;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.LedgerEntryRepository;
import com.ledgerline.repository.TransactionRepository;
import com.ledgerline.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final LedgerEntryRepository ledgerEntryRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> getEntriesByAccount(Long accountId, Long userId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!account.getUser().getId().equals(userId) && user.getRole() == UserRole.ACCOUNT_HOLDER) {
            throw new UnauthorizedAccessException("You are not authorized to view ledger entries for this account");
        }

        return ledgerEntryRepository.findByAccount(account).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<LedgerEntryResponse> getAllLedgerEntries(Long accountId, Pageable pageable) {
        if (accountId != null) {
            Account account = accountRepository.findById(accountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));
            return ledgerEntryRepository.findByAccount(account, pageable).map(this::mapToResponse);
        }
        return ledgerEntryRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ReconciliationResponse reconcileAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        List<LedgerEntry> entries = ledgerEntryRepository.findByAccount(account);

        BigDecimal totalCredits = BigDecimal.ZERO;
        BigDecimal totalDebits = BigDecimal.ZERO;

        for (LedgerEntry entry : entries) {
            if (entry.getEntryType() == EntryType.CREDIT) {
                totalCredits = totalCredits.add(entry.getAmount());
            } else if (entry.getEntryType() == EntryType.DEBIT) {
                totalDebits = totalDebits.add(entry.getAmount());
            }
        }

        BigDecimal ledgerBalance = totalCredits.subtract(totalDebits).setScale(4, RoundingMode.HALF_UP);
        BigDecimal bookBalance = account.getBalance().setScale(4, RoundingMode.HALF_UP);
        BigDecimal discrepancy = bookBalance.subtract(ledgerBalance);
        boolean isReconciled = discrepancy.compareTo(BigDecimal.ZERO) == 0;

        return ReconciliationResponse.builder()
                .accountId(account.getId())
                .accountNumber(account.getAccountNumber())
                .bookBalance(bookBalance)
                .ledgerBalance(ledgerBalance)
                .isReconciled(isReconciled)
                .discrepancy(discrepancy)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ReconciliationResponse> reconcileAllAccounts() {
        List<Account> allAccounts = accountRepository.findAll();
        List<ReconciliationResponse> results = new ArrayList<>(allAccounts.size());

        for (Account account : allAccounts) {
            results.add(reconcileAccount(account.getId()));
        }

        return results;
    }

    public LedgerEntryResponse mapToResponse(LedgerEntry entry) {
        return LedgerEntryResponse.builder()
                .id(entry.getId())
                .transactionReference(entry.getTransaction() != null ? entry.getTransaction().getReferenceNumber() : null)
                .accountNumber(entry.getAccount() != null ? entry.getAccount().getAccountNumber() : null)
                .entryType(entry.getEntryType().name())
                .amount(entry.getAmount())
                .currency(entry.getCurrency())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}

