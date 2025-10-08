package com.yourname.store.util;

import com.yourname.store.entity.Order;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class OrderSpecifications {

    private OrderSpecifications() {
    }

    public static Specification<Order> filter(String codeKeyword, LocalDateTime from, LocalDateTime to) {
        System.out.println("Creating Order specification with filters:");
        System.out.println("codeKeyword: " + codeKeyword);
        System.out.println("from: " + (from != null ? from.toString() : "null"));
        System.out.println("to: " + (to != null ? to.toString() : "null"));

        return (root, query, builder) -> {
            Predicate predicate = builder.conjunction();

            if (StringUtils.hasText(codeKeyword)) {
                String keyword = "%" + codeKeyword.trim().toLowerCase() + "%";
                predicate = builder.and(
                        predicate,
                        builder.like(builder.lower(root.get("code")), keyword));
                System.out.println("Added code filter: " + keyword);
            }

            if (from != null) {
                predicate = builder.and(predicate, builder.greaterThanOrEqualTo(root.get("orderDate"), from));
                System.out.println("Added from date filter: >= " + from);
            }

            if (to != null) {
                predicate = builder.and(predicate, builder.lessThanOrEqualTo(root.get("orderDate"), to));
                System.out.println("Added to date filter: <= " + to);
            }

            return predicate;
        };
    }
}
