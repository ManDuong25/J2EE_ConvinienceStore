package com.yourname.store.repository;

import com.yourname.store.repository.projection.TopProductProjection;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.yourname.store.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query(
            value = "SELECT oi.product_id AS productId, p.name AS name, "
                    + "SUM(oi.quantity) AS soldQuantity, SUM(oi.line_total) AS revenue "
                    + "FROM order_items oi "
                    + "JOIN orders o ON oi.order_id = o.id "
                    + "JOIN products p ON oi.product_id = p.id "
                    + "WHERE o.status = 'PAID' "
                    + "AND o.order_date BETWEEN :from AND :to "
                    + "GROUP BY oi.product_id, p.name "
                    + "ORDER BY soldQuantity DESC, revenue DESC "
                    + "LIMIT :limit",
            nativeQuery = true)
    List<TopProductProjection> findTopProducts(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("limit") int limit);
}
