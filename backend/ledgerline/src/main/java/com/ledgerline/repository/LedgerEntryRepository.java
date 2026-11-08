package com.ledgerline.repository;

import com.ledgerline.entity.Account;
import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

    List<LedgerEntry> findByTransaction(Transaction transaction);

    List<LedgerEntry> findByAccount(Account account);

    Page<LedgerEntry> findByAccount(Account account, Pageable pageable);

    Page<LedgerEntry> findAll(Pageable pageable);

    long countByAccount(Account account);
}
