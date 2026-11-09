package com.ledgerline.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepositRequest {

    @NotNull(message = "Destination account ID is required")
    private Long accountId;

    @NotNull(message = "Deposit amount is required and must be entered manually")
    @DecimalMin(value = "0.01", message = "Deposit amount must be strictly greater than zero")
    @Digits(integer = 15, fraction = 2, message = "Amount cannot have more than 2 decimal places")
    private BigDecimal amount;

    private String currency; // Defaults to "INR"

    private String paymentMethod; // BANK_TRANSFER, UPI, DEBIT_CARD, CREDIT_CARD, CASH_DEPOSIT

    // Bank Details (for Bank Transfer)
    private String bankName;
    private String bankAccountNumber;
    private String ifscCode;
    private String accountHolderName;

    // UPI Details
    private String upiId;

    // Card Details (Safe metadata only; NEVER PIN or CVV)
    private String cardNetwork;
    private String cardLast4;

    // Cash Deposit Details
    private String branchOrCdm;
    private String depositSlipReference;

    // Description / Remarks & External Reference Number
    private String description;
    private String externalReference;
}
