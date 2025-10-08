package com.yourname.store.repository;

import com.yourname.store.entity.Payment;
import com.yourname.store.entity.PaymentStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTxnRef(String txnRef);

    boolean existsByTxnRefAndStatus(String txnRef, PaymentStatus status);
}
