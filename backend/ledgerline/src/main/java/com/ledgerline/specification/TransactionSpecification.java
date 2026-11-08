package com.ledgerline.specification;

import com.ledgerline.entity.Account;
import com.ledgerline.entity.Transaction;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.TransactionStatus;
import com.ledgerline.entity.enums.TransactionType;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TransactionSpecification {

    /**
     * Filters transactions where the authenticated user owns either the source or destination account.
     * Uses explicit LEFT JOINs so transactions with a null sourceAccount (DEPOSIT) or
     * null destinationAccount (WITHDRAWAL) are correctly matched.
     */
    public static Specification<Transaction> forUser(User user) {
        return (root, query, cb) -> {
            if (user == null) {
                return cb.conjunction();
            }
            Join<Transaction, Account> sourceAccount = root.join("sourceAccount", JoinType.LEFT);
            Join<Transaction, Account> destAccount = root.join("destinationAccount", JoinType.LEFT);

            return cb.or(
                    cb.equal(sourceAccount.get("user"), user),
                    cb.equal(destAccount.get("user"), user)
            );
        };
    }

    public static Specification<Transaction> withType(TransactionType type) {
        return (root, query, cb) -> {
            if (type == null) {
                return null;
            }
            return cb.equal(root.get("transactionType"), type);
        };
    }

    public static Specification<Transaction> withStatus(TransactionStatus status) {
        return (root, query, cb) -> {
            if (status == null) {
                return null;
            }
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Transaction> createdBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }
            if (predicates.isEmpty()) {
                return null;
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

