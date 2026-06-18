package com.nemycookies.controller;

import com.nemycookies.dto.AuthRequest;
import com.nemycookies.dto.AuthResponse;
import com.nemycookies.dto.OrderResponse;
import com.nemycookies.enums.OrderStatus;
import com.nemycookies.model.Product;
import com.nemycookies.repository.ProductRepository;
import com.nemycookies.service.JwtService;
import com.nemycookies.service.OrderService;
import com.nemycookies.service.ProductService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final OrderService orderService;
    private final ProductService productService;
    private final JwtService jwtService;
    private final ProductRepository productRepository;

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password}")
    private String adminPassword;

    public AdminController(OrderService orderService, ProductService productService,
                           JwtService jwtService, ProductRepository productRepository) {
        this.orderService = orderService;
        this.productService = productService;
        this.jwtService = jwtService;
        this.productRepository = productRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        if (adminUsername.equals(request.getUsername()) && adminPassword.equals(request.getPassword())) {
            return ResponseEntity.ok(new AuthResponse(jwtService.generateToken(request.getUsername())));
        }
        return ResponseEntity.status(401).body(Map.of("error", "Credenciais inválidas"));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getOrders(@RequestParam(required = false) OrderStatus status) {
        if (status != null) return ResponseEntity.ok(orderService.getOrdersByStatus(status));
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long id,
                                                            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.updateStatus(id, OrderStatus.valueOf(body.get("status"))));
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @PatchMapping("/products/{id}/availability")
    public ResponseEntity<Product> updateAvailability(@PathVariable Long id,
                                                       @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(productService.updateAvailability(id, body.get("available")));
    }

    @PatchMapping("/products/{id}/stock")
    public ResponseEntity<Product> updateStock(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        int newStock = body.getOrDefault("stock", 0);
        if (newStock < 0 || newStock > 10000) throw new IllegalArgumentException("Estoque inválido");
        product.setStock(newStock);
        product.setAvailable(newStock > 0);
        return ResponseEntity.ok(productRepository.save(product));
    }

    @PatchMapping("/products/{id}/stock/add")
    public ResponseEntity<Product> addStock(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        int qty = body.getOrDefault("quantity", 0);
        if (qty <= 0 || qty > 10000) throw new IllegalArgumentException("Quantidade inválida");
        int newStock = product.getStock() + qty;
        product.setStock(newStock);
        product.setAvailable(true);
        return ResponseEntity.ok(productRepository.save(product));
    }
}
