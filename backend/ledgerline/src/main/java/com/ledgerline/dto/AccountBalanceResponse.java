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
public class AccountBalanceResponse {

    private Long accountId;
    private String accountNumber;
    private BigDecimal balance;
    private String currency;
    private LocalDateTime lastUpdated;
}
