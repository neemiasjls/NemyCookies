package com.nemycookies.dto;

import com.nemycookies.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class CreateOrderRequest {
    @NotBlank private String customerName;
    @NotBlank private String customerPhone;
    @NotNull private PaymentMethod paymentMethod;
    private BigDecimal changeAmount;
    private String notes;
    @NotEmpty private List<OrderItemRequest> items;

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String v) { this.customerName = v; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String v) { this.customerPhone = v; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod v) { this.paymentMethod = v; }
    public BigDecimal getChangeAmount() { return changeAmount; }
    public void setChangeAmount(BigDecimal v) { this.changeAmount = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> v) { this.items = v; }
}
