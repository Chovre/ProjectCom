package com.ledgerline.service;

import com.ledgerline.dto.AuthResponse;
import com.ledgerline.dto.LoginRequest;
import com.ledgerline.dto.RegisterRequest;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.UserRole;
import com.ledgerline.entity.enums.UserStatus;
import com.ledgerline.exception.DuplicateResourceException;
import com.ledgerline.repository.RefreshTokenRepository;
import com.ledgerline.repository.UserRepository;
import com.ledgerline.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .fullName("Test Customer")
                .email("customer@ledgerline.com")
                .passwordHash("$2a$10$hashedPassword")
                .role(UserRole.ACCOUNT_HOLDER)
                .status(UserStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Registration: Successfully registers new customer and returns JWT tokens")
    void testRegister_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Test Customer")
                .email("customer@ledgerline.com")
                .password("Password@123")
                .phone("9876543210")
                .build();

        when(userRepository.existsByEmail("customer@ledgerline.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateAccessToken(eq(1L), eq("customer@ledgerline.com"), eq("ACCOUNT_HOLDER")))
                .thenReturn("sample.access.jwt");
        when(tokenProvider.getRefreshExpirationMs()).thenReturn(604800000L);

        AuthResponse response = authService.register(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("sample.access.jwt", response.getToken());
        assertEquals("ACCOUNT_HOLDER", response.getRole());
        assertEquals("customer@ledgerline.com", response.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Registration: Duplicate email throws DuplicateResourceException")
    void testRegister_DuplicateEmail_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Test Customer")
                .email("customer@ledgerline.com")
                .password("Password@123")
                .build();

        when(userRepository.existsByEmail("customer@ledgerline.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () ->
                authService.register(request, "127.0.0.1"));

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Login: Valid credentials issue access token")
    void testLogin_Success() {
        LoginRequest request = LoginRequest.builder()
                .email("customer@ledgerline.com")
                .password("Password@123")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("customer@ledgerline.com", "Password@123"));
        when(userRepository.findByEmail("customer@ledgerline.com")).thenReturn(Optional.of(sampleUser));
        when(tokenProvider.generateAccessToken(eq(1L), eq("customer@ledgerline.com"), eq("ACCOUNT_HOLDER")))
                .thenReturn("sample.access.jwt");
        when(tokenProvider.getRefreshExpirationMs()).thenReturn(604800000L);

        AuthResponse response = authService.login(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("sample.access.jwt", response.getToken());
        assertEquals(1L, response.getUserId());
        assertEquals("ACCOUNT_HOLDER", response.getRole());
    }

    @Test
    @DisplayName("Login: Invalid credentials throw BadCredentialsException")
    void testLogin_InvalidCredentials_ThrowsException() {
        LoginRequest request = LoginRequest.builder()
                .email("customer@ledgerline.com")
                .password("WrongPassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () ->
                authService.login(request, "127.0.0.1"));
    }
}

