package com.yourname.store.util;

import com.yourname.store.entity.Product;
import jakarta.persistence.criteria.Predicate;
import lombok.experimental.UtilityClass;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class ProductSpecifications {

    public Specification<Product> filter(String keyword, Long categoryId) {
        return (root, query, builder) -> {
            Predicate predicate = builder.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                String likeExpression = "%" + keyword.trim().toLowerCase() + "%";
                Predicate namePredicate = builder.like(builder.lower(root.get("name")), likeExpression);
                Predicate codePredicate = builder.like(builder.lower(root.get("code")), likeExpression);
                predicate = builder.and(predicate, builder.or(namePredicate, codePredicate));
            }

            if (categoryId != null) {
                predicate = builder.and(predicate, builder.equal(root.get("category").get("id"), categoryId));
            }

            return predicate;
        };
    }
}
