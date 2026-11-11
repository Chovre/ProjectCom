package com.ledgerline.dto;

import com.ledgerline.entity.enums.DepositRequestStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepositRequestResponse {

    private Long id;
    private String requestReference;

    // Customer Details
    private Long userId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    // LedgerLine Account Details
    private Long accountId;
    private String accountNumber;
    private String accountType;

    // Bank Information
    private String bankName;
    private String bankAccountNumber; // Masked (e.g. XXXXXX1234)
    private String ifscCode;
    private String sourceAccountHolder;

    // Financial Details
    private BigDecimal amount;
    private String currency;
    private String paymentMethod;
    private String transactionReference;
    private String paymentProofPath;
    private String description;

    // Review & Status
    private DepositRequestStatus status;
    private String rejectionReason;
    private String adminNotes;
    private Long adminId;
    private String adminName;
    private String completedTransactionReference;

    // Timestamps
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
