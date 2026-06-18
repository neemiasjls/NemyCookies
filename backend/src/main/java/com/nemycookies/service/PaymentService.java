package com.nemycookies.service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.resources.payment.Payment;
import com.nemycookies.dto.PixPaymentCreatedResponse;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @PostConstruct
    public void init() {
        MercadoPagoConfig.setAccessToken(accessToken);
    }

    public PixPaymentCreatedResponse createPixPayment(Long orderId, BigDecimal amount,
                                                       String customerEmail, String customerName, String customerCpf) {
        try {
            PaymentClient client = new PaymentClient();
            OffsetDateTime expiresAt = OffsetDateTime.now().plusMinutes(30);

            PaymentCreateRequest request = PaymentCreateRequest.builder()
                    .transactionAmount(amount)
                    .description("NemyCookies - Pedido #" + orderId)
                    .paymentMethodId("pix")
                    .externalReference(String.valueOf(orderId))
                    .dateOfExpiration(expiresAt)
                    .payer(buildPayer(customerEmail, customerName, customerCpf))
                    .build();

            Payment payment = client.create(request);

            String qrCodeBase64 = payment.getPointOfInteraction()
                    .getTransactionData().getQrCodeBase64();
            String copyPasteCode = payment.getPointOfInteraction()
                    .getTransactionData().getQrCode();

            PixPaymentCreatedResponse response = new PixPaymentCreatedResponse();
            response.setOrderId(orderId);
            response.setPaymentId(payment.getId());
            response.setQrCodeBase64(qrCodeBase64);
            response.setCopyPasteCode(copyPasteCode);
            response.setTotalAmount(amount);
            response.setExpiresAt(expiresAt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
            return response;

        } catch (Exception e) {
            log.error("Erro ao criar pagamento PIX: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar QR Code PIX: " + e.getMessage());
        }
    }

    public Payment processCardPayment(Long orderId, BigDecimal amount, String token,
                                       String paymentMethodId, Integer installments,
                                       String customerEmail, String issuerId) {
        try {
            PaymentClient client = new PaymentClient();

            PaymentCreateRequest request = PaymentCreateRequest.builder()
                    .transactionAmount(amount)
                    .token(token)
                    .description("NemyCookies - Pedido #" + orderId)
                    .installments(installments != null ? installments : 1)
                    .paymentMethodId(paymentMethodId)
                    .externalReference(String.valueOf(orderId))
                    .payer(PaymentPayerRequest.builder()
                            .email(customerEmail)
                            .build())
                    .build();

            return client.create(request);

        } catch (Exception e) {
            log.error("Erro ao processar pagamento cartão: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao processar pagamento: " + e.getMessage());
        }
    }

    private PaymentPayerRequest buildPayer(String email, String name, String cpf) {
        var builder = PaymentPayerRequest.builder().email(email);
        if (name != null && !name.isBlank()) {
            String[] parts = name.trim().split(" ", 2);
            builder.firstName(parts[0]);
            if (parts.length > 1) builder.lastName(parts[1]);
        }
        if (cpf != null && !cpf.isBlank()) {
            String cpfClean = cpf.replaceAll("[^0-9]", "");
            builder.identification(com.mercadopago.client.common.IdentificationRequest.builder()
                    .type("CPF").number(cpfClean).build());
        }
        return builder.build();
    }

    public Payment getPayment(Long paymentId) {
        try {
            return new PaymentClient().get(paymentId);
        } catch (Exception e) {
            log.error("Erro ao consultar pagamento {}: {}", paymentId, e.getMessage());
            throw new RuntimeException("Erro ao consultar pagamento");
        }
    }
}
