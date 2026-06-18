package com.nemycookies.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public class CashOrderRequest {
    @NotBlank @Size(max = 100) private String customerName;
    @NotBlank @Size(max = 20)  private String customerPhone;
    @Size(max = 100) private String rua;
    @Size(max = 10)  private String numero;
    @Size(max = 100) private String bairro;
    @Size(max = 9)   private String cep;
    @Size(max = 20)  private String deliveryMethod;
    @Size(max = 500) private String notes;
    private BigDecimal changeAmount;
    @NotEmpty private List<@Valid OrderItemRequest> items;

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String v) { this.customerName = v; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String v) { this.customerPhone = v; }
    public String getRua() { return rua; }
    public void setRua(String v) { this.rua = v; }
    public String getNumero() { return numero; }
    public void setNumero(String v) { this.numero = v; }
    public String getBairro() { return bairro; }
    public void setBairro(String v) { this.bairro = v; }
    public String getCep() { return cep; }
    public void setCep(String v) { this.cep = v; }
    public String getDeliveryMethod() { return deliveryMethod; }
    public void setDeliveryMethod(String v) { this.deliveryMethod = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public BigDecimal getChangeAmount() { return changeAmount; }
    public void setChangeAmount(BigDecimal v) { this.changeAmount = v; }
    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> v) { this.items = v; }
}
