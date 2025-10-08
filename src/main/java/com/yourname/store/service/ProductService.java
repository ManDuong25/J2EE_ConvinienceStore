package com.yourname.store.service;

import com.yourname.store.dto.response.PageResponse;
import com.yourname.store.dto.response.ProductResponse;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    PageResponse<ProductResponse> searchProducts(String keyword, Long categoryId, Pageable pageable);

    ProductResponse getProduct(Long id);
}
