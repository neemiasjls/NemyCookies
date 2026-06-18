package com.nemycookies.service;

import com.nemycookies.dto.*;
import com.nemycookies.enums.OrderStatus;
import com.nemycookies.enums.PaymentMethod;
import com.nemycookies.model.Order;
import com.nemycookies.model.OrderItem;
import com.nemycookies.model.Product;
import com.nemycookies.repository.OrderRepository;
import com.nemycookies.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    // Taxa de entrega fixa, gratis a partir do valor minimo em cookies
    private static final BigDecimal DELIVERY_FEE = new BigDecimal("4.00");
    private static final BigDecimal FREE_DELIVERY_THRESHOLD = new BigDecimal("50.00");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    private String buildAddress(String rua, String numero, String bairro, String cep) {
        if (rua == null || rua.isBlank()) return null;
        StringBuilder sb = new StringBuilder();
        sb.append(rua.trim());
        if (numero != null && !numero.isBlank()) sb.append(", ").append(numero.trim());
        if (bairro != null && !bairro.isBlank()) sb.append(" - ").append(bairro.trim());
        if (cep != null && !cep.isBlank()) sb.append(" · CEP ").append(cep.trim());
        sb.append(" - Herculândia/SP");
        return sb.toString();
    }

    @Transactional
    public Order createOrderFromPix(CreatePixRequest req) {
        String address = buildAddress(req.getRua(), req.getNumero(), req.getBairro(), req.getCep());
        return buildAndSaveOrder(req.getCustomerName(), req.getCustomerPhone(), req.getCustomerEmail(),
                PaymentMethod.PIX, null, req.getNotes(), req.getItems(), "pending", address, req.getDeliveryMethod());
    }

    @Transactional
    public Order createOrderFromCard(CardPaymentRequest req) {
        String address = buildAddress(req.getRua(), req.getNumero(), req.getBairro(), req.getCep());
        return buildAndSaveOrder(req.getCustomerName(), req.getCustomerPhone(), req.getCustomerEmail(),
                PaymentMethod.CARD, null, req.getNotes(), req.getItems(), "pending", address, req.getDeliveryMethod());
    }

    @Transactional
    public Order createCashOrder(CashOrderRequest req) {
        String address = buildAddress(req.getRua(), req.getNumero(), req.getBairro(), req.getCep());
        Order order = buildAndSaveOrder(req.getCustomerName(), req.getCustomerPhone(), null,
                PaymentMethod.CASH, req.getChangeAmount(), req.getNotes(), req.getItems(), "cash", address, req.getDeliveryMethod());
        order.setStatus(OrderStatus.PENDING);
        orderRepository.save(order);
        deductStock(order);
        return orderRepository.save(order);
    }

    private Order buildAndSaveOrder(String name, String phone, String email, PaymentMethod method,
                                     BigDecimal changeAmount, String notes,
                                     List<OrderItemRequest> itemRequests, String paymentStatus, String address,
                                     String deliveryMethod) {
        boolean isDelivery = "DELIVERY".equalsIgnoreCase(deliveryMethod);
        if (isDelivery && (address == null || address.isBlank())) {
            throw new RuntimeException("Endereço é obrigatório para entrega");
        }

        Order order = new Order();
        order.setCustomerName(name);
        order.setCustomerPhone(phone);
        order.setCustomerEmail(email);
        order.setPaymentMethod(method);
        order.setChangeAmount(changeAmount);
        order.setNotes(notes);
        order.setPaymentStatus(paymentStatus);
        order.setAddress(isDelivery ? address : null);
        order.setDeliveryMethod(isDelivery ? "DELIVERY" : "PICKUP");

        List<OrderItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderItemRequest req : itemRequests) {
            Product product = productRepository.findByIdForUpdate(req.getProductId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

            if (product.getStock() < req.getQuantity()) {
                throw new RuntimeException("Estoque insuficiente para: " + product.getName());
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(req.getQuantity());
            item.setUnitPrice(product.getPrice());
            subtotal = subtotal.add(product.getPrice().multiply(BigDecimal.valueOf(req.getQuantity())));
            items.add(item);
        }

        BigDecimal deliveryFee = (isDelivery && subtotal.compareTo(FREE_DELIVERY_THRESHOLD) < 0)
                ? DELIVERY_FEE : BigDecimal.ZERO;

        order.setItems(items);
        order.setDeliveryFee(deliveryFee);
        order.setTotalAmount(subtotal.add(deliveryFee));
        return orderRepository.save(order);
    }

    @Transactional
    public void confirmPayment(Long orderId, Long externalPaymentId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado: " + orderId));
        if ("approved".equals(order.getPaymentStatus())) return;
        order.setPaymentStatus("approved");
        order.setExternalPaymentId(externalPaymentId);
        order.setStatus(OrderStatus.PENDING);
        deductStock(order);
        orderRepository.save(order);
    }

    @Transactional
    public void failPayment(Long orderId, Long externalPaymentId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            if (stockWasDeducted(order)) restoreStock(order);
            order.setPaymentStatus("rejected");
            if (externalPaymentId != null) order.setExternalPaymentId(externalPaymentId);
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);
        });
    }

    private void deductStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            int newStock = Math.max(0, product.getStock() - item.getQuantity());
            product.setStock(newStock);
            if (newStock == 0) product.setAvailable(false);
            productRepository.save(product);
        }
    }

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            product.setAvailable(true);
            productRepository.save(product);
        }
    }

    private boolean stockWasDeducted(Order order) {
        return "approved".equals(order.getPaymentStatus()) || "cash".equals(order.getPaymentStatus());
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(OrderResponse::from).collect(Collectors.toList());
    }

    public List<OrderResponse> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream().map(OrderResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado: " + id));
        if (status == OrderStatus.CANCELLED && stockWasDeducted(order)) {
            restoreStock(order);
        }
        order.setStatus(status);
        return OrderResponse.from(orderRepository.save(order));
    }

    public Order findById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado: " + id));
    }
}
