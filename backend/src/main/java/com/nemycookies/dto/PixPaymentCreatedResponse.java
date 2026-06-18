package com.nemycookies.dto;

import java.math.BigDecimal;

public class PixPaymentCreatedResponse {
    private Long orderId;
    private Long paymentId;
    private String qrCodeBase64;
    private String copyPasteCode;
    private BigDecimal totalAmount;
    private String expiresAt;

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long v) { this.orderId = v; }
    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long v) { this.paymentId = v; }
    public String getQrCodeBase64() { return qrCodeBase64; }
    public void setQrCodeBase64(String v) { this.qrCodeBase64 = v; }
    public String getCopyPasteCode() { return copyPasteCode; }
    public void setCopyPasteCode(String v) { this.copyPasteCode = v; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal v) { this.totalAmount = v; }
    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String v) { this.expiresAt = v; }
}
