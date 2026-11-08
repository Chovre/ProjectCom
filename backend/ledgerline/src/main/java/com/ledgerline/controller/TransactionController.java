package com.ledgerline.controller;

import com.ledgerline.dto.*;
import com.ledgerline.entity.User;
import com.ledgerline.security.SecurityUtils;
import com.ledgerline.service.DashboardService;
import com.ledgerline.service.TransactionService;
import com.ledgerline.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Endpoints for financial transactions: deposits, withdrawals, and transfers")
public class TransactionController {

    private final TransactionService transactionService;
    private final UserService userService;
    private final DashboardService dashboardService;

    @PostMapping("/deposit")
    @Operation(summary = "Deposit funds", description = "Executes an authorized sandbox funding operation with credit ledger record")
    public ResponseEntity<TransactionResponse> deposit(
            @Valid @RequestBody DepositRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest httpRequest) {
        User user = userService.getCurrentUser();
        String ip = SecurityUtils.getClientIp(httpRequest);
        TransactionResponse response = transactionService.deposit(request, user.getId(), idempotencyKey, ip);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/withdraw")
    @Operation(summary = "Withdraw funds", description = "Performs an atomic withdrawal with row-level locking and debit ledger record")
    public ResponseEntity<TransactionResponse> withdraw(
            @Valid @RequestBody WithdrawalRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest httpRequest) {
        User user = userService.getCurrentUser();
        String ip = SecurityUtils.getClientIp(httpRequest);
        TransactionResponse response = transactionService.withdraw(request, user.getId(), idempotencyKey, ip);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/transfer")
    @Operation(summary = "Transfer funds", description = "Transfers funds between accounts with deadlock-free deterministic locking and balanced double-entry ledger")
    public ResponseEntity<TransactionResponse> transfer(
            @Valid @RequestBody TransferRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest httpRequest) {
        User user = userService.getCurrentUser();
        String ip = SecurityUtils.getClientIp(httpRequest);
        TransactionResponse response = transactionService.transfer(request, user.getId(), idempotencyKey, ip);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/my")
    @Operation(summary = "Get transaction history", description = "Returns paginated and filterable transaction history for the authenticated user")
    public ResponseEntity<Page<TransactionResponse>> getMyTransactions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User user = userService.getCurrentUser();
        Page<TransactionResponse> transactions = transactionService.getMyTransactions(
                user.getId(), type, status, startDate, endDate, pageable);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{reference}")
    @Operation(summary = "Get transaction by reference", description = "Returns details for a specific transaction by reference number")
    public ResponseEntity<TransactionResponse> getByReference(@PathVariable String reference) {
        User user = userService.getCurrentUser();
        TransactionResponse response = transactionService.getTransactionByReference(reference, user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get customer dashboard data", description = "Returns aggregated statistics and recent transactions for customer dashboard")
    public ResponseEntity<CustomerDashboardResponse> getCustomerDashboard() {
        User user = userService.getCurrentUser();
        CustomerDashboardResponse response = dashboardService.getCustomerDashboard(user);
        return ResponseEntity.ok(response);
    }
}

