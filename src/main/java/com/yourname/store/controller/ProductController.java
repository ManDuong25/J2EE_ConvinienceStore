package com.yourname.store.controller;

import com.yourname.store.dto.response.PageResponse;
import com.yourname.store.dto.response.ProductResponse;
import com.yourname.store.service.ProductService;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Validated
public class ProductController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "name", "price", "code");

    private final ProductService productService;

    @GetMapping
    public PageResponse<ProductResponse> searchProducts(
            @RequestParam(value = "q", required = false) String keyword,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", defaultValue = "createdAt,desc") String sort) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), parseSort(sort));
        return productService.searchProducts(keyword, categoryId, pageable);
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable("id") Long id) {
        return productService.getProduct(id);
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Order.desc("createdAt"));
        }
        String[] parts = sort.split(",");
        String property = parts[0];
        if (!ALLOWED_SORT_FIELDS.contains(property)) {
            return Sort.by(Sort.Order.desc("createdAt"));
        }
        boolean asc = parts.length < 2 || parts[1].equalsIgnoreCase("asc");
        return asc ? Sort.by(property).ascending() : Sort.by(property).descending();
    }
}
