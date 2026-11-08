package com.ledgerline.service;

import com.ledgerline.dto.AuthResponse;
import com.ledgerline.dto.LoginRequest;
import com.ledgerline.dto.RegisterRequest;
import com.ledgerline.entity.RefreshToken;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.UserRole;
import com.ledgerline.entity.enums.UserStatus;
import com.ledgerline.exception.DuplicateResourceException;
import com.ledgerline.exception.ResourceNotFoundException;
import com.ledgerline.exception.UnauthorizedAccessException;
import com.ledgerline.repository.RefreshTokenRepository;
import com.ledgerline.repository.UserRepository;
import com.ledgerline.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;

    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with email " + request.getEmail() + " already exists");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(UserRole.ACCOUNT_HOLDER)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().name());
        String refreshTokenStr = createRefreshToken(savedUser);

        auditService.log(savedUser.getId(), "USER_REGISTERED", "USER",
                String.valueOf(savedUser.getId()), "Customer registered successfully: " + savedUser.getEmail(), ipAddress);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .role(savedUser.getRole().name())
                .userId(savedUser.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        String email = request.getEmail().trim().toLowerCase();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            userRepository.findByEmail(email).ifPresent(u ->
                    auditService.log(u.getId(), "LOGIN_FAILED", "USER",
                            String.valueOf(u.getId()), "Failed login attempt: invalid credentials", ipAddress)
            );
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedAccessException("Account is " + user.getStatus().name() + ". Please contact administrator.");
        }

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshTokenStr = createRefreshToken(user);

        auditService.log(user.getId(), "LOGIN_SUCCESS", "USER",
                String.valueOf(user.getId()), "User logged in successfully", ipAddress);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .role(user.getRole().name())
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedAccessException("Invalid refresh token"));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedAccessException("Refresh token has expired. Please log in again.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(token)
                .tokenType("Bearer")
                .role(user.getRole().name())
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public void logout(String email, String ipAddress) {
        userRepository.findByEmail(email).ifPresent(user -> {
            refreshTokenRepository.deleteByUser(user);
            auditService.log(user.getId(), "LOGOUT", "USER",
                    String.valueOf(user.getId()), "User logged out", ipAddress);
        });
    }

    private String createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiryDate(Instant.now().plusMillis(tokenProvider.getRefreshExpirationMs()))
                .build();

        refreshTokenRepository.save(refreshToken);
        return token;
    }
}

