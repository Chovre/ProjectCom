package com.ledgerline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditorDashboardResponse {

    private long totalTransactions;
    private long successfulTransactions;
    private long failedTransactions;
    private long totalLedgerEntries;
    private long reconciledAccounts;
    private long unreconciledAccounts;
}
