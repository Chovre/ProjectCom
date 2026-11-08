package com.ledgerline.repository;

import com.ledgerline.entity.Account;
import com.ledgerline.entity.Transaction;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.TransactionStatus;
import com.ledgerline.entity.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    Optional<Transaction> findByReferenceNumber(String referenceNumber);

    Page<Transaction> findBySourceAccountOrDestinationAccount(
            Account sourceAccount, Account destinationAccount, Pageable pageable);

    @Query(value = "SELECT t FROM Transaction t " +
            "LEFT JOIN t.sourceAccount sa " +
            "LEFT JOIN t.destinationAccount da " +
            "WHERE sa.user = :user OR da.user = :user",
           countQuery = "SELECT COUNT(t) FROM Transaction t " +
            "LEFT JOIN t.sourceAccount sa " +
            "LEFT JOIN t.destinationAccount da " +
            "WHERE sa.user = :user OR da.user = :user")
    Page<Transaction> findBySourceAccountUserOrDestinationAccountUser(
            @Param("user") User user, Pageable pageable);

    long countByStatus(TransactionStatus status);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") TransactionStatus status);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.status = :status AND t.transactionType = :type")
    BigDecimal sumAmountByStatusAndType(
            @Param("status") TransactionStatus status,
            @Param("type") TransactionType type);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "LEFT JOIN t.sourceAccount sa " +
            "LEFT JOIN t.destinationAccount da " +
            "WHERE t.status = com.ledgerline.entity.enums.TransactionStatus.SUCCESS " +
            "AND t.transactionType = :type " +
            "AND (sa.user = :user OR da.user = :user)")
    BigDecimal sumAmountByUserAndType(
            @Param("user") User user,
            @Param("type") TransactionType type);
}
