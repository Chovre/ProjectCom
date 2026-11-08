package com.ledgerline.controller;

import com.ledgerline.dto.AccountApplicationRequest;
import com.ledgerline.dto.AccountApplicationResponse;
import com.ledgerline.dto.AccountBalanceResponse;
import com.ledgerline.dto.AccountResponse;
import com.ledgerline.entity.User;
import com.ledgerline.security.SecurityUtils;
import com.ledgerline.service.AccountService;
import com.ledgerline.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Tag(name = "Accounts", description = "Endpoints for managing bank accounts and account applications")
public class AccountController {

    private final AccountService accountService;
    private final UserService userService;

    @PostMapping("/apply")
    @Operation(summary = "Apply for a new bank account", description = "Submits an account application for administrative review")
    public ResponseEntity<AccountApplicationResponse> apply(
            @Valid @RequestBody AccountApplicationRequest request,
            HttpServletRequest httpRequest) {
        User user = userService.getCurrentUser();
        String ip = SecurityUtils.getClientIp(httpRequest);
        AccountApplicationResponse response = accountService.applyForAccount(request, user.getId(), ip);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/my")
    @Operation(summary = "Get current customer's accounts", description = "Returns all bank accounts owned by the authenticated customer")
    public ResponseEntity<List<AccountResponse>> getMyAccounts() {
        User user = userService.getCurrentUser();
        List<AccountResponse> accounts = accountService.getMyAccounts(user.getId());
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get account details by ID", description = "Returns detailed account information with ownership check")
    public ResponseEntity<AccountResponse> getAccountById(@PathVariable Long id) {
        User user = userService.getCurrentUser();
        AccountResponse response = accountService.getAccountById(id, user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/balance")
    @Operation(summary = "Get account balance by ID", description = "Returns real-time account balance with ownership check")
    public ResponseEntity<AccountBalanceResponse> getAccountBalance(@PathVariable Long id) {
        User user = userService.getCurrentUser();
        AccountBalanceResponse response = accountService.getAccountBalance(id, user.getId());
        return ResponseEntity.ok(response);
    }
}

