package com.ledgerline.controller;

import com.ledgerline.dto.AuditorDashboardResponse;
import com.ledgerline.dto.AuditLogResponse;
import com.ledgerline.dto.LedgerEntryResponse;
import com.ledgerline.dto.ReconciliationResponse;
import com.ledgerline.dto.TransactionResponse;
import com.ledgerline.service.AuditService;
import com.ledgerline.service.DashboardService;
import com.ledgerline.service.LedgerService;
import com.ledgerline.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@RestController
@RequestMapping("/api/auditor")
@PreAuthorize("hasRole('AUDITOR')")
@RequiredArgsConstructor
@Tag(name = "Auditor", description = "Read-only endpoints for independent financial auditing and ledger reconciliation")
public class AuditorController {

    private final DashboardService dashboardService;
    private final TransactionService transactionService;
    private final LedgerService ledgerService;
    private final AuditService auditService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get auditor dashboard metrics (read-only)")
    public ResponseEntity<AuditorDashboardResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getAuditorDashboard());
    }

    @GetMapping("/transactions")
    @Operation(summary = "Audit transaction records with filters (read-only)")
    public ResponseEntity<Page<TransactionResponse>> getTransactions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(transactionService.getAllTransactions(type, status, startDate, endDate, pageable));
    }

    @GetMapping("/ledger")
    @Operation(summary = "Audit double-entry ledger records (read-only)")
    public ResponseEntity<Page<LedgerEntryResponse>> getLedgerEntries(
            @RequestParam(required = false) Long accountId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ledgerService.getAllLedgerEntries(accountId, pageable));
    }

    @GetMapping("/audit")
    @Operation(summary = "Audit immutable event logs (read-only)")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditService.getAllAuditLogs(pageable));
    }

    @GetMapping("/reconciliation")
    @Operation(summary = "Generate ledger-to-account balance reconciliation report (read-only)")
    public ResponseEntity<List<ReconciliationResponse>> getReconciliation() {
        return ResponseEntity.ok(ledgerService.reconcileAllAccounts());
    }
}

