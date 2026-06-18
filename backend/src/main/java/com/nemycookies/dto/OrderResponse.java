package com.nemycookies.dto;

import com.nemycookies.enums.OrderStatus;
import com.nemycookies.enums.PaymentMethod;
import com.nemycookies.model.Order;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class OrderResponse {
    private Long id;
    private String customerName;
    private String customerPhone;
    private PaymentMethod paymentMethod;
    private OrderStatus status;
    private String paymentStatus;
    private BigDecimal totalAmount;
    private BigDecimal changeAmount;
    private String notes;
    private String address;
    private String deliveryMethod;
    private BigDecimal deliveryFee;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;

    public static class OrderItemResponse {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;

        public Long getProductId() { return productId; }
        public void setProductId(Long v) { this.productId = v; }
        public String getProductName() { return productName; }
        public void setProductName(String v) { this.productName = v; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer v) { this.quantity = v; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal v) { this.unitPrice = v; }
        public BigDecimal getSubtotal() { return subtotal; }
        public void setSubtotal(BigDecimal v) { this.subtotal = v; }
    }

    public static OrderResponse from(Order order) {
        OrderResponse r = new OrderResponse();
        r.setId(order.getId());
        r.setCustomerName(order.getCustomerName());
        r.setCustomerPhone(order.getCustomerPhone());
        r.setPaymentMethod(order.getPaymentMethod());
        r.setStatus(order.getStatus());
        r.setPaymentStatus(order.getPaymentStatus());
        r.setTotalAmount(order.getTotalAmount());
        r.setChangeAmount(order.getChangeAmount());
        r.setNotes(order.getNotes());
        r.setAddress(order.getAddress());
        r.setDeliveryMethod(order.getDeliveryMethod());
        r.setDeliveryFee(order.getDeliveryFee());
        r.setCreatedAt(order.getCreatedAt());
        if (order.getItems() != null) {
            r.setItems(order.getItems().stream().map(item -> {
                OrderItemResponse ir = new OrderItemResponse();
                ir.setProductId(item.getProduct().getId());
                ir.setProductName(item.getProduct().getName());
                ir.setQuantity(item.getQuantity());
                ir.setUnitPrice(item.getUnitPrice());
                ir.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                return ir;
            }).collect(Collectors.toList()));
        }
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long v) { this.id = v; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String v) { this.customerName = v; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String v) { this.customerPhone = v; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod v) { this.paymentMethod = v; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus v) { this.status = v; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String v) { this.paymentStatus = v; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal v) { this.totalAmount = v; }
    public BigDecimal getChangeAmount() { return changeAmount; }
    public void setChangeAmount(BigDecimal v) { this.changeAmount = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { this.address = v; }
    public String getDeliveryMethod() { return deliveryMethod; }
    public void setDeliveryMethod(String v) { this.deliveryMethod = v; }
    public BigDecimal getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(BigDecimal v) { this.deliveryFee = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
    public List<OrderItemResponse> getItems() { return items; }
    public void setItems(List<OrderItemResponse> v) { this.items = v; }
}
