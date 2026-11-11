package com.ledgerline.controller;

import com.ledgerline.dto.ApproveDepositRequestDto;
import com.ledgerline.dto.DepositRequestResponse;
import com.ledgerline.dto.RejectDepositRequestDto;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.DepositRequestStatus;
import com.ledgerline.security.SecurityUtils;
import com.ledgerline.service.DepositRequestService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/deposits")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Deposits", description = "Administrator endpoints for reviewing, approving, and rejecting customer deposit requests")
public class AdminDepositController {

    private final DepositRequestService depositRequestService;
    private final UserService userService;

    @GetMapping("/pending")
    @Operation(summary = "Get pending deposit requests", description = "Retrieves all deposit requests waiting for administrator verification and approval")
    public ResponseEntity<Page<DepositRequestResponse>> getPendingRequests(
            @PageableDefault(size = 10, sort = "submittedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(depositRequestService.getPendingRequests(pageable));
    }

    @GetMapping
    @Operation(summary = "Get all deposit requests", description = "Retrieves all deposit requests with optional status filtering (PENDING, APPROVED, REJECTED, FAILED)")
    public ResponseEntity<Page<DepositRequestResponse>> getAllRequests(
            @RequestParam(required = false) DepositRequestStatus status,
            @PageableDefault(size = 10, sort = "submittedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(depositRequestService.getAllRequests(status, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get deposit request by ID", description = "Retrieves complete details of any customer deposit request for administrator audit")
    public ResponseEntity<DepositRequestResponse> getRequestById(@PathVariable Long id) {
        User admin = userService.getCurrentUser();
        return ResponseEntity.ok(depositRequestService.getRequestById(id, admin.getId(), true));
    }

    @PutMapping("/{id}/approve")
    @Operation(summary = "Approve deposit request", description = "Verifies settlement, atomically locks account, credits customer balance, and writes double-entry ledger record")
    public ResponseEntity<DepositRequestResponse> approveDeposit(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveDepositRequestDto dto,
            HttpServletRequest httpRequest) {
        User admin = userService.getCurrentUser();
        String ip = SecurityUtils.getClientIp(httpRequest);
        return ResponseEntity.ok(depositRequestService.approveDepositRequest(id, admin.getId(), dto, ip));
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "Reject deposit request", description = "Rejects a deposit request with a required rejection reason without modifying account balances")
    public ResponseEntity<DepositRequestResponse> rejectDeposit(
            @PathVariable Long id,
            @Valid @RequestBody RejectDepositRequestDto dto,
            HttpServletRequest httpRequest) {
        User admin = userService.getCurrentUser();
        String ip = SecurityUtils.getClientIp(httpRequest);
        return ResponseEntity.ok(depositRequestService.rejectDepositRequest(id, admin.getId(), dto, ip));
    }
}
