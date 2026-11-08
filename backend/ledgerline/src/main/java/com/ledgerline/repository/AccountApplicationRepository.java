package com.ledgerline.repository;

import com.ledgerline.entity.AccountApplication;
import com.ledgerline.entity.User;
import com.ledgerline.entity.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountApplicationRepository extends JpaRepository<AccountApplication, Long> {

    List<AccountApplication> findByUser(User user);

    List<AccountApplication> findByStatus(ApplicationStatus status);

    List<AccountApplication> findByUserAndStatus(User user, ApplicationStatus status);

    Page<AccountApplication> findByStatus(ApplicationStatus status, Pageable pageable);

    Page<AccountApplication> findByUser(User user, Pageable pageable);

    long countByStatus(ApplicationStatus status);
}
