import { rateLimit } from "convex-helpers/server/rateLimit";
import type { GenericMutationCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";

/**
 * Rate limit configurations
 *
 * Configurações centralizadas de rate limiting
 */

/**
 * Validação de cupom
 * Limite: 5 tentativas por minuto por CPF
 * Previne: Brute force de códigos de cupom
 */
export const couponRateLimit = {
  name: "coupon_validation",
  config: {
    kind: "token bucket" as const,
    rate: 5,
    period: 60_000,
    capacity: 5,
  },
};

/**
 * Criação de pedidos (checkout)
 * Limite: 3 checkouts a cada 5 minutos por CPF
 * Previne: Spam de pedidos, fraude
 */
export const checkoutRateLimit = {
  name: "checkout",
  config: {
    kind: "token bucket" as const,
    rate: 3,
    period: 300_000,
    capacity: 3,
  },
};

/**
 * Webhook de pagamento
 * Limite: 20 webhooks por minuto por pedido
 * Previne: Webhook bombing, retry loops
 */
export const webhookRateLimit = {
  name: "payment_webhook",
  config: {
    kind: "token bucket" as const,
    rate: 20,
    period: 60_000,
    capacity: 20,
  },
};

type RateLimitContext = GenericMutationCtx<DataModel>;

// Helper function para usar nos handlers
// Note: Rate limiting requer acesso de escrita ao DB (apenas mutations, não queries)
export async function checkRateLimit(
  ctx: RateLimitContext,
  rateLimitConfig: {
    name: string;
    config: {
      kind: "token bucket";
      rate: number;
      period: number;
      capacity: number;
    };
  },
  key: string,
) {
  return await rateLimit(ctx, {
    name: rateLimitConfig.name,
    key,
    config: rateLimitConfig.config,
  });
}
