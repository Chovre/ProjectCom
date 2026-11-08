package com.ledgerline.repository;

import com.ledgerline.entity.Account;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.AccountStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> findByUser(User user);

    Optional<Account> findByAccountNumber(String accountNumber);

    List<Account> findByUserAndStatus(User user, AccountStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    Optional<Account> findByIdForUpdate(@Param("id") Long id);

    List<Account> findAllByStatus(AccountStatus status);

    long countByStatus(AccountStatus status);
}
