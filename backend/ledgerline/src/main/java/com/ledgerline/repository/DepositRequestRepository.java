package com.ledgerline.repository;

import com.ledgerline.entity.DepositRequest;
import com.ledgerline.entity.enums.DepositRequestStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepositRequestRepository extends JpaRepository<DepositRequest, Long> {

    Optional<DepositRequest> findByRequestReference(String requestReference);

    Page<DepositRequest> findByUserIdOrderBySubmittedAtDesc(Long userId, Pageable pageable);

    Page<DepositRequest> findByStatusOrderBySubmittedAtDesc(DepositRequestStatus status, Pageable pageable);

    Page<DepositRequest> findAllByOrderBySubmittedAtDesc(Pageable pageable);

    long countByStatus(DepositRequestStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DepositRequest d WHERE d.id = :id")
    Optional<DepositRequest> findByIdForUpdate(@Param("id") Long id);
}
