package com.ledgerline.service;

import com.ledgerline.dto.*;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.AccountApplication;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.AccountStatus;
import com.ledgerline.entity.enums.ApplicationStatus;
import com.ledgerline.entity.enums.UserRole;
import com.ledgerline.exception.ResourceNotFoundException;
import com.ledgerline.exception.UnauthorizedAccessException;
import com.ledgerline.repository.AccountApplicationRepository;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final AccountApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AccountApplicationResponse applyForAccount(AccountApplicationRequest request, Long userId, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        AccountApplication application = AccountApplication.builder()
                .user(user)
                .accountType(request.getAccountType())
                .currency(request.getCurrency() != null ? request.getCurrency().trim().toUpperCase() : "INR")
                .status(ApplicationStatus.PENDING)
                .build();

        AccountApplication saved = applicationRepository.save(application);

        auditService.log(userId, "ACCOUNT_APPLICATION_SUBMITTED", "ACCOUNT_APPLICATION",
                String.valueOf(saved.getId()),
                "User applied for " + request.getAccountType() + " account", ipAddress);

        return mapToApplicationResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getMyAccounts(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        return accountRepository.findByUser(user).stream()
                .map(this::mapToAccountResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Long accountId, Long userId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!account.getUser().getId().equals(userId) && user.getRole() == UserRole.ACCOUNT_HOLDER) {
            throw new UnauthorizedAccessException("You are not authorized to view this account");
        }

        return mapToAccountResponse(account);
    }

    @Transactional(readOnly = true)
    public AccountBalanceResponse getAccountBalance(Long accountId, Long userId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!account.getUser().getId().equals(userId) && user.getRole() == UserRole.ACCOUNT_HOLDER) {
            throw new UnauthorizedAccessException("You are not authorized to view this account balance");
        }

        return AccountBalanceResponse.builder()
                .accountId(account.getId())
                .accountNumber(account.getAccountNumber())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .lastUpdated(account.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<AccountResponse> getAllAccounts(Pageable pageable) {
        return accountRepository.findAll(pageable)
                .map(this::mapToAccountResponse);
    }

    @Transactional
    public AccountResponse updateAccountStatus(Long accountId, AccountStatus status, Long adminId, String ipAddress) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        AccountStatus oldStatus = account.getStatus();
        account.setStatus(status);
        Account updated = accountRepository.save(account);

        auditService.log(adminId, "ACCOUNT_STATUS_UPDATED", "ACCOUNT",
                String.valueOf(account.getId()),
                "Account " + account.getAccountNumber() + " status changed from " + oldStatus + " to " + status, ipAddress);

        return mapToAccountResponse(updated);
    }

    @Transactional
    public AccountResponse approveApplication(Long applicationId, String adminNotes, Long adminId, String ipAddress) {
        AccountApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new IllegalStateException("Application is already " + application.getStatus());
        }

        application.setStatus(ApplicationStatus.APPROVED);
        application.setAdminNotes(adminNotes);
        applicationRepository.save(application);

        String accountNumber = generateUniqueAccountNumber();

        Account account = Account.builder()
                .accountNumber(accountNumber)
                .user(application.getUser())
                .accountType(application.getAccountType())
                .currency(application.getCurrency())
                .balance(BigDecimal.ZERO)
                .status(AccountStatus.ACTIVE)
                .build();

        Account savedAccount = accountRepository.save(account);

        auditService.log(adminId, "ACCOUNT_APPLICATION_APPROVED", "ACCOUNT_APPLICATION",
                String.valueOf(application.getId()),
                "Application approved. Created account: " + accountNumber, ipAddress);

        auditService.log(adminId, "ACCOUNT_CREATED", "ACCOUNT",
                String.valueOf(savedAccount.getId()),
                "Account created for user: " + application.getUser().getEmail(), ipAddress);

        return mapToAccountResponse(savedAccount);
    }

    @Transactional
    public AccountApplicationResponse rejectApplication(Long applicationId, String adminNotes, Long adminId, String ipAddress) {
        AccountApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new IllegalStateException("Application is already " + application.getStatus());
        }

        application.setStatus(ApplicationStatus.REJECTED);
        application.setAdminNotes(adminNotes);
        AccountApplication saved = applicationRepository.save(application);

        auditService.log(adminId, "ACCOUNT_APPLICATION_REJECTED", "ACCOUNT_APPLICATION",
                String.valueOf(application.getId()),
                "Application rejected with notes: " + adminNotes, ipAddress);

        return mapToApplicationResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<AccountApplicationResponse> getApplications(String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            ApplicationStatus appStatus = ApplicationStatus.valueOf(status.trim().toUpperCase());
            return applicationRepository.findByStatus(appStatus, pageable).map(this::mapToApplicationResponse);
        }
        return applicationRepository.findAll(pageable).map(this::mapToApplicationResponse);
    }

    private String generateUniqueAccountNumber() {
        String accNum;
        do {
            long rand = 1000000000L + (long) (secureRandom.nextDouble() * 9000000000L);
            accNum = "ACC" + rand;
        } while (accountRepository.findByAccountNumber(accNum).isPresent());
        return accNum;
    }

    public AccountResponse mapToAccountResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType().name())
                .currency(account.getCurrency())
                .balance(account.getBalance())
                .status(account.getStatus().name())
                .ownerName(account.getUser() != null ? account.getUser().getFullName() : null)
                .createdAt(account.getCreatedAt())
                .build();
    }

    public AccountApplicationResponse mapToApplicationResponse(AccountApplication app) {
        return AccountApplicationResponse.builder()
                .id(app.getId())
                .accountType(app.getAccountType().name())
                .currency(app.getCurrency())
                .status(app.getStatus().name())
                .adminNotes(app.getAdminNotes())
                .createdAt(app.getCreatedAt())
                .build();
    }
}

