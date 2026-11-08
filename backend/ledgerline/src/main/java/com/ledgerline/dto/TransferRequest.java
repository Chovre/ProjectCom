package com.ledgerline.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
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
public class TransferRequest {

    @NotNull(message = "Source account ID is required")
    private Long sourceAccountId;

    @NotBlank(message = "Destination account number is required")
    private String destinationAccountNumber;

    @NotNull(message = "Amount is required and must be entered manually")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    @Digits(integer = 15, fraction = 2, message = "Amount cannot have more than 2 decimal places")
    private BigDecimal amount;

    private String description;
}
