package com.ledgerline.dto;

import com.ledgerline.entity.enums.AccountStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private AccountStatus status;
}
