package com.ledgerline.controller;

import com.ledgerline.dto.AuthResponse;
import com.ledgerline.dto.LoginRequest;
import com.ledgerline.dto.RegisterRequest;
import com.ledgerline.security.SecurityUtils;
import com.ledgerline.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for customer registration, authentication, token refresh, and logout")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new customer", description = "Creates a new ACCOUNT_HOLDER user account and returns JWT tokens")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String ip = SecurityUtils.getClientIp(httpRequest);
        AuthResponse response = authService.register(request, ip);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates user credentials and issues access & refresh tokens")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ip = SecurityUtils.getClientIp(httpRequest);
        AuthResponse response = authService.login(request, ip);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Exchanges a valid refresh token for a newly issued access token")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "User logout", description = "Invalidates the active refresh token and logs out the session")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest httpRequest) {
        String email = SecurityUtils.getCurrentUserEmail();
        String ip = SecurityUtils.getClientIp(httpRequest);
        if (email != null) {
            authService.logout(email, ip);
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}

