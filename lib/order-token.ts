/**
 * Key under which a guest's single-use order token is parked in
 * `sessionStorage` between placing an order and returning from the gateway.
 *
 * `sessionStorage`, not `localStorage`: the token is a one-shot credential that
 * should die with the tab, not linger on a shared machine.
 */
export function orderTokenKey(orderId: string): string {
  return `pp_order_${orderId}`
}
