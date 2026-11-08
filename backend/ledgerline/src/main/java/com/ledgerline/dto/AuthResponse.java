package com.ledgerline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private String role;
    private Long userId;
    private String fullName;
    private String email;
}
