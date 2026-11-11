package com.ledgerline.controller;

import com.ledgerline.dto.CreateDepositRequestDto;
import com.ledgerline.dto.DepositRequestResponse;
import com.ledgerline.entity.User;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deposits")
@RequiredArgsConstructor
@Tag(name = "Deposit Requests", description = "Endpoints for customer deposit request submissions and status tracking")
public class DepositRequestController {

    private final DepositRequestService depositRequestService;
    private final UserService userService;

    @PostMapping("/requests")
    @Operation(summary = "Submit a deposit request", description = "Submits a manual deposit request for administrator review without immediate balance modification")
    public ResponseEntity<DepositRequestResponse> createDepositRequest(
            @Valid @RequestBody CreateDepositRequestDto requestDto,
            HttpServletRequest httpRequest) {
        User user = userService.getCurrentUser();
        String ip = SecurityUtils.getClientIp(httpRequest);
        DepositRequestResponse response = depositRequestService.createDepositRequest(requestDto, user.getId(), ip);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/my-requests")
    @Operation(summary = "Get current customer deposit requests", description = "Retrieves paginated deposit requests submitted by the authenticated customer")
    public ResponseEntity<Page<DepositRequestResponse>> getMyRequests(
            @PageableDefault(size = 10, sort = "submittedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(depositRequestService.getMyRequests(user.getId(), pageable));
    }

    @GetMapping("/requests/{id}")
    @Operation(summary = "Get deposit request details", description = "Retrieves details of a specific deposit request enforcing customer ownership")
    public ResponseEntity<DepositRequestResponse> getRequestById(@PathVariable Long id) {
        User user = userService.getCurrentUser();
        boolean isAdmin = user.getRole() != null && user.getRole().name().equals("ADMIN");
        return ResponseEntity.ok(depositRequestService.getRequestById(id, user.getId(), isAdmin));
    }
}

