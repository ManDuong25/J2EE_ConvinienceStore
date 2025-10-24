package com.yourname.store.service.impl;

import com.yourname.store.dto.response.PageResponse;
import com.yourname.store.dto.response.ProductResponse;
import com.yourname.store.entity.Product;
import com.yourname.store.exception.NotFoundException;
import com.yourname.store.mapper.ProductMapper;
import com.yourname.store.repository.ProductRepository;
import com.yourname.store.service.ProductService;
import com.yourname.store.util.ProductSpecifications;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    public PageResponse<ProductResponse> searchProducts(String keyword, Long categoryId, Pageable pageable) {
        Specification<Product> specification = ProductSpecifications.filter(keyword, categoryId);
        Page<Product> page = productRepository.findAll(specification, pageable);
        List<ProductResponse> content = page.stream()
                .map(productMapper::toResponse)
                .toList();
        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast());
    }

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        return productMapper.toResponse(product);
    }
}
