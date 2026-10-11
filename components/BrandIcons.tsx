/**
 * Brand marks for the payment methods.
 *
 * Hand-drawn rather than pulled from a package: two small SVGs are cheaper than
 * another dependency, and it keeps the checkout bundle free of anything that
 * isn't on screen. Each mark is drawn to its own viewBox and sized by the
 * caller, so they line up next to the Lucide icons used elsewhere.
 */

export function StripeMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label="Stripe">
      <rect width="24" height="24" rx="5" fill="#635BFF" />
      {/* The Stripe "S", built from two mirrored bowls. */}
      <path
        fill="#fff"
        d="M11.03 9.42c0-.62.52-.87 1.35-.87 1.2 0 2.73.37 3.94.98V6.86a10.4 10.4 0 0 0-3.94-.73c-3.22 0-5.36 1.69-5.36 4.5 0 4.4 6.03 3.69 6.03 5.58 0 .73-.64 1.1-1.5 1.1-1.32 0-3.01-.55-4.35-1.28v2.7c1.4.6 2.8.87 4.35.87 3.3 0 5.57-1.63 5.57-4.48 0-4.74-6.09-3.94-6.09-5.7Z"
      />
    </svg>
  )
}

export function PaypalMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label="PayPal">
      {/* Back "P" — PayPal's darker blue. */}
      <path
        fill="#003087"
        d="M7.6 20.6h-3c-.5 0-.8-.4-.7-.9L7.3 3.6c.1-.4.4-.6.8-.6h6.1c2.1 0 3.7.4 4.7 1.3.9.8 1.3 2 1.1 3.5-.1.7-.3 1.3-.5 1.8-.2.5-.6 1-1 1.4-.4.4-1 .8-1.7 1-.7.3-1.5.4-2.5.4h-2c-.4 0-.8.3-.9.7l-.8 4.2-.1.4c0 .2-.2.3-.4.3H7.6Z"
      />
      {/* Front "P" — the lighter blue, offset so the two interlock. */}
      <path
        fill="#009CDE"
        d="M19.2 10.5c-.1.7-.3 1.3-.5 1.8-.2.5-.6 1-1 1.4-.4.4-1 .8-1.7 1-.7.3-1.5.4-2.5.4h-2c-.4 0-.8.3-.9.7l-.9 4.6h2.6c.4 0 .7-.3.8-.7l.7-3.7c.1-.4.4-.7.8-.7h.9c2.1 0 3.7-.4 4.7-1.3 1-.9 1.5-2.2 1.7-3.9.1-.9 0-1.6-.3-2.1-.2-.3-.4-.5-.7-.6v1.1Z"
      />
    </svg>
  )
}

/** Small "card" mark used for the generic card row and the demo provider. */
export function CardMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label="Card">
      <rect x="2" y="5" width="20" height="14" rx="3" fill="#1A1F71" />
      <rect x="2" y="9" width="20" height="3" fill="#fff" opacity="0.85" />
      <rect x="5" y="15" width="6" height="2" rx="1" fill="#F7B600" />
    </svg>
  )
}
