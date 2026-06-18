package com.nemycookies.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class CardPaymentRequest {
    @NotBlank @Size(max = 100) private String customerName;
    @NotBlank @Size(max = 20)  private String customerPhone;
    @NotBlank @Email @Size(max = 150) private String customerEmail;
    @Size(max = 100) private String rua;
    @Size(max = 10)  private String numero;
    @Size(max = 100) private String bairro;
    @Size(max = 9)   private String cep;
    @Size(max = 20)  private String deliveryMethod;
    @Size(max = 500) private String notes;
    @NotEmpty private List<@Valid OrderItemRequest> items;
    @NotBlank private String token;
    @NotBlank private String paymentMethodId;
    private Integer installments = 1;
    private String issuerId;

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String v) { this.customerName = v; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String v) { this.customerPhone = v; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String v) { this.customerEmail = v; }
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
    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> v) { this.items = v; }
    public String getToken() { return token; }
    public void setToken(String v) { this.token = v; }
    public String getPaymentMethodId() { return paymentMethodId; }
    public void setPaymentMethodId(String v) { this.paymentMethodId = v; }
    public Integer getInstallments() { return installments; }
    public void setInstallments(Integer v) { this.installments = v; }
    public String getIssuerId() { return issuerId; }
    public void setIssuerId(String v) { this.issuerId = v; }
}
