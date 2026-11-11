package com.ledgerline.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDepositRequestDto {

    @NotNull(message = "Account ID is required")
    private Long accountId;

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "0.01", message = "Deposit amount must be at least ₹0.01")
    @Digits(integer = 15, fraction = 2, message = "Amount can have at most 2 decimal places")
    private BigDecimal amount;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    private String bankName;

    private String bankAccountNumber;

    private String ifscCode;

    private String sourceAccountHolder;

    private String transactionReference;

    private String paymentProofPath;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
}
