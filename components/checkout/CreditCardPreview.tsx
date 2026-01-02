"use client";

import * as React from "react";

interface CreditCardPreviewProps {
  cardNumber: string;
  cardHolderName: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardCvv: string;
}

export function CreditCardPreview({
  cardNumber,
  cardHolderName,
  cardExpiryMonth,
  cardExpiryYear,
  cardCvv,
}: CreditCardPreviewProps) {
  // Format card number with spaces
  const formattedNumber = cardNumber
    ? cardNumber
        .replace(/\D/g, "") // Strip non-digit characters
        .match(/.{1,4}/g) // Group digits in sets of four
        ?.join(" ") // Join with spaces
        .trim() || "•••• •••• •••• ••••" // Trim trailing space and fallback
    : "•••• •••• •••• ••••";

  // Format expiry date
  const formattedExpiry =
    cardExpiryMonth && cardExpiryYear
      ? `${cardExpiryMonth}/${cardExpiryYear.slice(-2)}`
      : "MM/AA";

  // Card holder name or placeholder
  const displayName = cardHolderName || "SEU NOME";

  // CVV display
  const displayCvv = cardCvv || "•••";

  return (
    <div className="mb-6">
      <div className="relative mx-auto aspect-[1.586] w-full max-w-sm overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-6 text-white shadow-2xl">
        {/* Card chip */}
        <div className="mb-8 h-10 w-12 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 opacity-80" />

        {/* Card number */}
        <div className="mb-6 font-mono text-xl tracking-wider">
          {formattedNumber}
        </div>

        <div className="flex items-end justify-between">
          {/* Card holder name and expiry */}
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
              Nome do Titular
            </div>
            <div className="text-sm font-medium uppercase tracking-wide">
              {displayName}
            </div>
          </div>

          {/* Expiry date */}
          <div className="text-right">
            <div className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
              Validade
            </div>
            <div className="font-mono text-sm tracking-wide">
              {formattedExpiry}
            </div>
          </div>
        </div>

        {/* CVV on the back (small indicator) */}
        <div className="absolute top-4 right-4 rounded bg-white/20 px-2 py-1 text-xs">
          CVV: {displayCvv}
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
      </div>
    </div>
  );
}
