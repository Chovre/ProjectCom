package com.ledgerline.service;

import com.ledgerline.dto.ApproveDepositRequestDto;
import com.ledgerline.dto.CreateDepositRequestDto;
import com.ledgerline.dto.DepositRequestResponse;
import com.ledgerline.dto.RejectDepositRequestDto;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.DepositRequest;
import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.entity.Transaction;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.*;
import com.ledgerline.exception.AccountNotActiveException;
import com.ledgerline.exception.InvalidTransactionException;
import com.ledgerline.exception.UnauthorizedAccessException;
import com.ledgerline.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class DepositRequestServiceTest {

    @Mock
    private DepositRequestRepository depositRequestRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private LedgerEntryRepository ledgerEntryRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DepositRequestService depositRequestService;

    private User customer;
    private User admin;
    private Account account;

    @BeforeEach
    void setUp() {
        customer = User.builder()
                .id(1L)
                .fullName("Rahul Sharma")
                .email("rahul@example.com")
                .phone("9000000001")
                .role(UserRole.ACCOUNT_HOLDER)
                .status(UserStatus.ACTIVE)
                .build();

        admin = User.builder()
                .id(99L)
                .fullName("System Admin")
                .email("admin@ledgerline.com")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        account = Account.builder()
                .id(10L)
                .accountNumber("LL1000000001")
                .user(customer)
                .accountType(AccountType.SAVINGS)
                .currency("INR")
                .balance(new BigDecimal("500.0000"))
                .status(AccountStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Customer submits deposit request -> Status PENDING, balance UNCHANGED")
    void testCreateDepositRequest_Success() {
        CreateDepositRequestDto dto = CreateDepositRequestDto.builder()
                .accountId(10L)
                .amount(new BigDecimal("2500.00"))
                .paymentMethod("BANK_TRANSFER")
                .bankName("State Bank of India")
                .bankAccountNumber("1234567890")
                .ifscCode("SBIN0001234")
                .sourceAccountHolder("Rahul Sharma")
                .transactionReference("UTR123456789")
                .description("Salary Deposit")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(accountRepository.findById(10L)).thenReturn(Optional.of(account));
        when(depositRequestRepository.save(any(DepositRequest.class))).thenAnswer(invocation -> {
            DepositRequest dr = invocation.getArgument(0);
            dr.setId(101L);
            return dr;
        });

        DepositRequestResponse response = depositRequestService.createDepositRequest(dto, 1L, "127.0.0.1");

        assertNotNull(response);
        assertEquals(DepositRequestStatus.PENDING, response.getStatus());
        assertEquals(new BigDecimal("2500.00"), response.getAmount());
        assertEquals("XXXXXX7890", response.getBankAccountNumber());
        assertEquals(new BigDecimal("500.0000"), account.getBalance(), "Customer balance must NOT change upon submission");
        verify(depositRequestRepository).save(any(DepositRequest.class));
        verify(auditService).log(eq(1L), eq("DEPOSIT_REQUEST_SUBMITTED"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Admin approves deposit request -> Atomically credits account and creates LedgerEntry")
    void testApproveDepositRequest_Success() {
        DepositRequest pending = DepositRequest.builder()
                .id(101L)
                .requestReference("DEP-REQ-20261111-001")
                .user(customer)
                .account(account)
                .amount(new BigDecimal("1000.0000"))
                .currency("INR")
                .paymentMethod("BANK_TRANSFER")
                .status(DepositRequestStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(99L)).thenReturn(Optional.of(admin));
        when(depositRequestRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(pending));
        when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> {
            Transaction t = inv.getArgument(0);
            t.setId(501L);
            return t;
        });
        when(ledgerEntryRepository.save(any(LedgerEntry.class))).thenAnswer(inv -> inv.getArgument(0));
        when(depositRequestRepository.save(any(DepositRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ApproveDepositRequestDto approveDto = ApproveDepositRequestDto.builder()
                .adminNotes("Verified bank credit in SBI account")
                .build();

        DepositRequestResponse response = depositRequestService.approveDepositRequest(101L, 99L, approveDto, "127.0.0.1");

        assertNotNull(response);
        assertEquals(DepositRequestStatus.APPROVED, response.getStatus());
        assertEquals(new BigDecimal("1500.0000"), account.getBalance(), "Balance must increase by exactly 1000.0000");
        verify(transactionRepository).save(any(Transaction.class));
        verify(ledgerEntryRepository).save(any(LedgerEntry.class));
        verify(auditService).log(eq(99L), eq("DEPOSIT_APPROVED"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Admin rejects deposit request -> Status REJECTED, balance UNCHANGED")
    void testRejectDepositRequest_Success() {
        DepositRequest pending = DepositRequest.builder()
                .id(101L)
                .requestReference("DEP-REQ-20261111-001")
                .user(customer)
                .account(account)
                .amount(new BigDecimal("1000.0000"))
                .currency("INR")
                .paymentMethod("UPI")
                .status(DepositRequestStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(99L)).thenReturn(Optional.of(admin));
        when(depositRequestRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(pending));
        when(depositRequestRepository.save(any(DepositRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        RejectDepositRequestDto rejectDto = RejectDepositRequestDto.builder()
                .rejectionReason("UTR reference not found in bank statement")
                .build();

        DepositRequestResponse response = depositRequestService.rejectDepositRequest(101L, 99L, rejectDto, "127.0.0.1");

        assertNotNull(response);
        assertEquals(DepositRequestStatus.REJECTED, response.getStatus());
        assertEquals("UTR reference not found in bank statement", response.getRejectionReason());
        assertEquals(new BigDecimal("500.0000"), account.getBalance(), "Balance must remain unchanged on rejection");
        verify(transactionRepository, never()).save(any(Transaction.class));
        verify(auditService).log(eq(99L), eq("DEPOSIT_REJECTED"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Cannot approve already APPROVED request (Duplicate Protection)")
    void testApproveDepositRequest_AlreadyApproved_ThrowsException() {
        DepositRequest alreadyApproved = DepositRequest.builder()
                .id(101L)
                .status(DepositRequestStatus.APPROVED)
                .build();

        when(userRepository.findById(99L)).thenReturn(Optional.of(admin));
        when(depositRequestRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(alreadyApproved));

        assertThrows(IllegalStateException.class, () ->
                depositRequestService.approveDepositRequest(101L, 99L, null, "127.0.0.1"));
    }

    @Test
    @DisplayName("Non-admin user cannot approve deposit request")
    void testApproveDepositRequest_Unauthorized_ThrowsException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer)); // Customer, not admin

        assertThrows(UnauthorizedAccessException.class, () ->
                depositRequestService.approveDepositRequest(101L, 1L, null, "127.0.0.1"));
    }
}

