package com.ledgerline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountResponse {

    private Long id;
    private String accountNumber;
    private String accountType;
    private String currency;
    private BigDecimal balance;
    private String status;
    private String ownerName;
    private LocalDateTime createdAt;
}
