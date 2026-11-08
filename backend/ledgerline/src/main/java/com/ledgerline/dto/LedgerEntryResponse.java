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
public class LedgerEntryResponse {

    private Long id;
    private String transactionReference;
    private String accountNumber;
    private String entryType;
    private BigDecimal amount;
    private String currency;
    private LocalDateTime createdAt;
}
