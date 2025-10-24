package com.yourname.store.service;

import com.yourname.store.dto.response.PageResponse;
import com.yourname.store.dto.response.ProductResponse;
import com.yourname.store.entity.Product;

import java.util.List;

import org.springframework.data.domain.Pageable;

public interface ProductService {
    List<Product> getAllProducts();

    PageResponse<ProductResponse> searchProducts(String keyword, Long categoryId, Pageable pageable);

    ProductResponse getProduct(Long id);
}
