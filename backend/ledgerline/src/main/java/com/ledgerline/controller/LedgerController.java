package com.ledgerline.controller;

import com.ledgerline.dto.LedgerEntryResponse;
import com.ledgerline.entity.User;
import com.ledgerline.service.LedgerService;
import com.ledgerline.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ledger")
@RequiredArgsConstructor
@Tag(name = "Ledger", description = "Endpoints for immutable double-entry ledger records")
public class LedgerController {

    private final LedgerService ledgerService;
    private final UserService userService;

    @GetMapping("/account/{accountId}")
    @Operation(summary = "Get ledger entries for an account", description = "Returns immutable debit and credit ledger entries for the specified account")
    public ResponseEntity<List<LedgerEntryResponse>> getEntriesByAccount(@PathVariable Long accountId) {
        User user = userService.getCurrentUser();
        List<LedgerEntryResponse> entries = ledgerService.getEntriesByAccount(accountId, user.getId());
        return ResponseEntity.ok(entries);
    }
}

