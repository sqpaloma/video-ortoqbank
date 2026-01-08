import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

/**
 * Rate limit configurations using official Convex Rate Limiter component
 *
 * Configurações centralizadas de rate limiting
 * @see https://www.convex.dev/components/rate-limiter
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  /**
   * Validação de cupom
   * Limite: 5 tentativas por minuto por CPF
   * Previne: Brute force de códigos de cupom
   */
  coupon_validation: {
    kind: "token bucket",
    rate: 5,
    period: MINUTE,
    capacity: 5,
  },

  /**
   * Criação de pedidos (checkout)
   * Limite: 3 checkouts a cada 5 minutos por CPF
   * Previne: Spam de pedidos, fraude
   */
  checkout: {
    kind: "token bucket",
    rate: 3,
    period: 5 * MINUTE,
    capacity: 3,
  },

  /**
   * Webhook de pagamento
   * Limite: 20 webhooks por minuto por pedido
   * Previne: Webhook bombing, retry loops
   */
  payment_webhook: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 20,
  },
});
