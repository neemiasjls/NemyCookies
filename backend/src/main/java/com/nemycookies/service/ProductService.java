package com.nemycookies.service;

import com.nemycookies.model.Category;
import com.nemycookies.model.Product;
import com.nemycookies.repository.CategoryRepository;
import com.nemycookies.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc();
    }

    public List<Product> getAllAvailableProducts() {
        return productRepository.findByAvailableTrueOrderByCategoryDisplayOrderAscIdAsc();
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product updateAvailability(Long id, boolean available) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + id));
        product.setAvailable(available);
        return productRepository.save(product);
    }
}
