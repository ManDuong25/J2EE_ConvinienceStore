package com.yourname.store.repository;

import com.yourname.store.entity.Order;
import com.yourname.store.repository.projection.RevenueStatsProjection;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

  Optional<Order> findByCode(String code);

  // Truy vấn lấy items và products
  @EntityGraph(attributePaths = { "items", "items.product" })
  Optional<Order> findWithDetailsById(Long id);

  // Truy vấn lấy payments
  @EntityGraph(attributePaths = { "payments" })
  Optional<Order> findWithPaymentsById(Long id);

  // Truy vấn lấy thông tin user
  @EntityGraph(attributePaths = { "user" })
  Optional<Order> findWithUserById(Long id);

  @Override
  @EntityGraph(attributePaths = { "items", "items.product", "user" })
  Page<Order> findAll(Specification<Order> spec, Pageable pageable);

  @Query(value = """
      SELECT DATE_FORMAT(o.order_date, '%Y-%m-%d') AS bucket,
             COALESCE(SUM(o.total_amount), 0) AS revenue,
             COUNT(o.id) AS order_count
      FROM orders o
      WHERE o.status = 'PAID'
        AND o.order_date BETWEEN :from AND :to
      GROUP BY DATE(o.order_date)
      ORDER BY DATE(o.order_date)
      """, nativeQuery = true)
  List<RevenueStatsProjection> calculateDailyRevenue(
      @Param("from") LocalDateTime from,
      @Param("to") LocalDateTime to);
}
