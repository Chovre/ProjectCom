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
public class DashboardStatsResponse {

    private long totalCustomers;
    private long totalAccounts;
    private long activeAccounts;
    private long pendingApplications;
    private long pendingDeposits;
    private long totalTransactions;
    private long successfulTransactions;
    private long failedTransactions;
    private BigDecimal totalVolume;
}
