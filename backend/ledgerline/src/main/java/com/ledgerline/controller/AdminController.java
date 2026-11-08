package com.ledgerline.controller;

import com.ledgerline.dto.*;
import com.ledgerline.entity.User;
import com.ledgerline.security.SecurityUtils;
import com.ledgerline.service.*;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Administrator", description = "Endpoints for platform administration, user management, application approvals, and audit monitoring")
public class AdminController {

    private final DashboardService dashboardService;
    private final UserService userService;
    private final AccountService accountService;
    private final TransactionService transactionService;
    private final AuditService auditService;
    private final LedgerService ledgerService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get administrator dashboard metrics")
    public ResponseEntity<DashboardStatsResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    @GetMapping("/users")
    @Operation(summary = "Get all users with pagination")
    public ResponseEntity<Page<UserResponse>> getUsers(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @PatchMapping("/users/{id}/status")
    @Operation(summary = "Update user status (ACTIVE, INACTIVE, SUSPENDED)")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequest request,
            HttpServletRequest httpRequest) {
        String ip = SecurityUtils.getClientIp(httpRequest);
        return ResponseEntity.ok(userService.updateUserStatus(id, request, ip));
    }

    @GetMapping("/accounts")
    @Operation(summary = "Get all customer accounts")
    public ResponseEntity<Page<AccountResponse>> getAccounts(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(accountService.getAllAccounts(pageable));
    }

    @PatchMapping("/accounts/{id}/status")
    @Operation(summary = "Update account status (ACTIVE, INACTIVE, FROZEN, CLOSED)")
    public ResponseEntity<AccountResponse> updateAccountStatus(
            @PathVariable Long id,
            @Valid @RequestBody AccountStatusUpdateRequest request,
            HttpServletRequest httpRequest) {
        User admin = userService.getCurrentUser();
        String ip = SecurityUtils.getClientIp(httpRequest);
        return ResponseEntity.ok(accountService.updateAccountStatus(id, request.getStatus(), admin.getId(), ip));
    }

    @GetMapping("/applications")
    @Operation(summary = "Get account applications with optional status filter")
    public ResponseEntity<Page<AccountApplicationResponse>> getApplications(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(accountService.getApplications(status, pageable));
    }

    @PostMapping("/applications/{id}/approve")
    @Operation(summary = "Approve account application and generate bank account")
    public ResponseEntity<AccountResponse> approveApplication(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpRequest) {
        User admin = userService.getCurrentUser();
        String ip = SecurityUtils.getClientIp(httpRequest);
        String notes = body != null ? body.get("adminNotes") : null;
        return ResponseEntity.ok(accountService.approveApplication(id, notes, admin.getId(), ip));
    }

    @PostMapping("/applications/{id}/reject")
    @Operation(summary = "Reject account application")
    public ResponseEntity<AccountApplicationResponse> rejectApplication(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpRequest) {
        User admin = userService.getCurrentUser();
        String ip = SecurityUtils.getClientIp(httpRequest);
        String notes = body != null ? body.get("adminNotes") : null;
        return ResponseEntity.ok(accountService.rejectApplication(id, notes, admin.getId(), ip));
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get all transactions across system with filters")
    public ResponseEntity<Page<TransactionResponse>> getTransactions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(transactionService.getAllTransactions(type, status, startDate, endDate, pageable));
    }

    @GetMapping("/audit")
    @Operation(summary = "Get all system audit logs")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditService.getAllAuditLogs(pageable));
    }

    @GetMapping("/ledger/reconciliation")
    @Operation(summary = "Reconcile all bank accounts with double-entry ledger")
    public ResponseEntity<List<ReconciliationResponse>> getReconciliation() {
        return ResponseEntity.ok(ledgerService.reconcileAllAccounts());
    }
}

