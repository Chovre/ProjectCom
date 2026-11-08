package com.ledgerline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountApplicationResponse {

    private Long id;
    private String accountType;
    private String currency;
    private String status;
    private String adminNotes;
    private LocalDateTime createdAt;
}
