package com.ledgerline.dto;

import com.ledgerline.entity.enums.AccountType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountApplicationRequest {

    @NotNull(message = "Account type is required")
    private AccountType accountType;

    private String currency;
}
