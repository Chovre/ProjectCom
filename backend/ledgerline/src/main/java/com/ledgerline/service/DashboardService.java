package com.ledgerline.service;

import com.ledgerline.dto.*;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.*;
import com.ledgerline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final AccountApplicationRepository applicationRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final LedgerService ledgerService;
    private final AccountService accountService;
    private final TransactionService transactionService;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getAdminDashboard() {
        long totalCustomers = userRepository.countByRole(UserRole.ACCOUNT_HOLDER);
        long totalAccounts = accountRepository.count();
        long activeAccounts = accountRepository.countByStatus(AccountStatus.ACTIVE);
        long pendingApplications = applicationRepository.countByStatus(ApplicationStatus.PENDING);
        long totalTransactions = transactionRepository.count();
        long successfulTransactions = transactionRepository.countByStatus(TransactionStatus.SUCCESS);
        long failedTransactions = transactionRepository.countByStatus(TransactionStatus.FAILED);
        BigDecimal totalVolume = transactionRepository.sumAmountByStatus(TransactionStatus.SUCCESS);
        if (totalVolume == null) {
            totalVolume = BigDecimal.ZERO;
        }

        return DashboardStatsResponse.builder()
                .totalCustomers(totalCustomers)
                .totalAccounts(totalAccounts)
                .activeAccounts(activeAccounts)
                .pendingApplications(pendingApplications)
                .totalTransactions(totalTransactions)
                .successfulTransactions(successfulTransactions)
                .failedTransactions(failedTransactions)
                .totalVolume(totalVolume)
                .build();
    }

    @Transactional(readOnly = true)
    public AuditorDashboardResponse getAuditorDashboard() {
        long totalTransactions = transactionRepository.count();
        long successfulTransactions = transactionRepository.countByStatus(TransactionStatus.SUCCESS);
        long failedTransactions = transactionRepository.countByStatus(TransactionStatus.FAILED);
        long totalLedgerEntries = ledgerEntryRepository.count();

        List<ReconciliationResponse> reconciliations = ledgerService.reconcileAllAccounts();
        long reconciledCount = reconciliations.stream().filter(ReconciliationResponse::isReconciled).count();
        long unreconciledCount = reconciliations.size() - reconciledCount;

        return AuditorDashboardResponse.builder()
                .totalTransactions(totalTransactions)
                .successfulTransactions(successfulTransactions)
                .failedTransactions(failedTransactions)
                .totalLedgerEntries(totalLedgerEntries)
                .reconciledAccounts(reconciledCount)
                .unreconciledAccounts(unreconciledCount)
                .build();
    }

    @Transactional(readOnly = true)
    public CustomerDashboardResponse getCustomerDashboard(User user) {
        List<AccountResponse> accounts = accountService.getMyAccounts(user.getId());

        BigDecimal totalDeposits = transactionRepository.sumAmountByUserAndType(user, TransactionType.DEPOSIT);
        BigDecimal totalWithdrawals = transactionRepository.sumAmountByUserAndType(user, TransactionType.WITHDRAWAL);

        List<TransactionResponse> recentTransactions = transactionRepository
                .findBySourceAccountUserOrDestinationAccountUser(user, PageRequest.of(0, 5, Sort.by("createdAt").descending()))
                .getContent()
                .stream()
                .map(transactionService::mapToResponse)
                .toList();

        return CustomerDashboardResponse.builder()
                .fullName(user.getFullName())
                .accounts(accounts)
                .totalDeposits(totalDeposits != null ? totalDeposits : BigDecimal.ZERO)
                .totalWithdrawals(totalWithdrawals != null ? totalWithdrawals : BigDecimal.ZERO)
                .recentTransactions(recentTransactions)
                .build();
    }
}

