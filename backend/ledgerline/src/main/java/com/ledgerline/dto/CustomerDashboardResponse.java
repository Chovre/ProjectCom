package com.ledgerline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerDashboardResponse {

    private String fullName;
    private List<AccountResponse> accounts;
    private BigDecimal totalDeposits;
    private BigDecimal totalWithdrawals;
    private List<TransactionResponse> recentTransactions;
}
