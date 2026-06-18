package com.nemycookies.controller;

import com.mercadopago.resources.payment.Payment;
import com.nemycookies.dto.*;
import com.nemycookies.model.Order;
import com.nemycookies.service.OrderService;
import com.nemycookies.service.PaymentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;
    private final OrderService orderService;

    @Value("${mercadopago.webhook-secret}")
    private String webhookSecret;

    public PaymentController(PaymentService paymentService, OrderService orderService) {
        this.paymentService = paymentService;
        this.orderService = orderService;
    }

    private boolean isValidWebhookSignature(String xSignature, String xRequestId, String dataId) {
        try {
            if (xSignature == null || xSignature.isBlank()) return false;
            String ts = null, receivedHash = null;
            for (String part : xSignature.split(",")) {
                String[] kv = part.trim().split("=", 2);
                if (kv.length == 2) {
                    if ("ts".equals(kv[0])) ts = kv[1];
                    else if ("v1".equals(kv[0])) receivedHash = kv[1];
                }
            }
            if (ts == null || receivedHash == null) return false;
            String manifest = "id:" + dataId + ";request-id:" + xRequestId + ";ts:" + ts + ";";
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String computed = HexFormat.of().formatHex(mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8)));
            return computed.equals(receivedHash);
        } catch (Exception e) {
            log.warn("Erro ao verificar assinatura do webhook: {}", e.getMessage());
            return false;
        }
    }

    @PostMapping("/pix")
    public ResponseEntity<?> createPixPayment(@Valid @RequestBody CreatePixRequest request) {
        Order order = orderService.createOrderFromPix(request);
        try {
            PixPaymentCreatedResponse response = paymentService.createPixPayment(
                    order.getId(), order.getTotalAmount(), request.getCustomerEmail(),
                    request.getCustomerName(), request.getCustomerCpf());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            orderService.failPayment(order.getId(), null);
            log.error("Erro ao criar PIX: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/card")
    public ResponseEntity<?> processCardPayment(@Valid @RequestBody CardPaymentRequest request) {
        Order order = orderService.createOrderFromCard(request);
        try {
            Payment payment = paymentService.processCardPayment(
                    order.getId(), order.getTotalAmount(), request.getToken(),
                    request.getPaymentMethodId(), request.getInstallments(),
                    request.getCustomerEmail(), request.getIssuerId());

            String status = payment.getStatus();
            if ("approved".equals(status)) {
                orderService.confirmPayment(order.getId(), payment.getId());
                return ResponseEntity.ok(Map.of("status", "approved", "orderId", order.getId(), "message", "Pagamento aprovado!"));
            } else if ("rejected".equals(status)) {
                orderService.failPayment(order.getId(), payment.getId());
                return ResponseEntity.badRequest().body(Map.of("status", "rejected", "message", "Pagamento recusado"));
            }
            return ResponseEntity.ok(Map.of("status", status, "orderId", order.getId(), "message", "Em processamento"));
        } catch (Exception e) {
            orderService.failPayment(order.getId(), null);
            log.error("Erro ao processar cartão: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cash")
    public ResponseEntity<OrderResponse> createCashOrder(@Valid @RequestBody CashOrderRequest request) {
        Order order = orderService.createCashOrder(request);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @GetMapping("/{paymentId}/status")
    public ResponseEntity<Map<String, Object>> getPaymentStatus(@PathVariable Long paymentId) {
        Payment payment = paymentService.getPayment(paymentId);
        String status = payment.getStatus();
        String externalRef = payment.getExternalReference();
        if ("approved".equals(status) && externalRef != null) {
            try {
                orderService.confirmPayment(Long.parseLong(externalRef), paymentId);
            } catch (Exception e) {
                log.warn("Erro ao confirmar via polling: {}", e.getMessage());
            }
        }
        return ResponseEntity.ok(Map.of("status", status, "externalReference", externalRef != null ? externalRef : ""));
    }

    @PostMapping(value = "/webhook", consumes = "application/json")
    public ResponseEntity<Void> webhook(
            @RequestHeader(value = "x-signature", required = false) String xSignature,
            @RequestHeader(value = "x-request-id", required = false) String xRequestId,
            @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) return ResponseEntity.ok().build();

        // Verifica assinatura do Mercado Pago
        Object dataObj = body.get("data");
        String dataId = (dataObj instanceof Map<?, ?> d) ? String.valueOf(d.get("id")) : "";
        if (!isValidWebhookSignature(xSignature, xRequestId != null ? xRequestId : "", dataId)) {
            log.warn("Webhook recebido com assinatura inválida — ignorado");
            return ResponseEntity.ok().build();
        }
        try {
            String type = (String) body.get("type");
            if (!"payment".equals(type)) return ResponseEntity.ok().build();
            if (dataObj instanceof Map<?, ?> data) {
                Object idObj = data.get("id");
                if (idObj != null) {
                    Long paymentId = Long.parseLong(idObj.toString());
                    Payment payment = paymentService.getPayment(paymentId);
                    String externalRef = payment.getExternalReference();
                    if (externalRef != null) {
                        Long orderId = Long.parseLong(externalRef);
                        if ("approved".equals(payment.getStatus())) {
                            orderService.confirmPayment(orderId, paymentId);
                        } else if ("rejected".equals(payment.getStatus()) || "cancelled".equals(payment.getStatus())) {
                            orderService.failPayment(orderId, paymentId);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erro webhook MP: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }
}
