/**
 * End-to-end smoke test for the Poorprice storefront commerce layer.
 *
 * Exercises the real HTTP surface of a running server (default :3123) against
 * the real database. Run with:  node scripts/smoke-commerce.mjs
 */

const B = process.env.BASE_URL || 'http://localhost:3123'

let pass = 0
let fail = 0
const failures = []

const ok = (name, cond) => {
  if (cond) {
    pass++
    console.log('  ok   ' + name)
  } else {
    fail++
    failures.push(name)
    console.log('  FAIL ' + name)
  }
}

const j = async (p, o) => {
  const r = await fetch(B + p, o)
  let d = null
  try {
    d = await r.json()
  } catch {
    /* non-JSON body */
  }
  return { s: r.status, d, h: r.headers }
}

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

// Mirrors lib/money.ts: tax on subtotal only, flat shipping under $150.
const expectTotal = (price, q) => {
  const sub = r2(price * q)
  const ship = sub >= 150 ? 0 : 14.99
  const tax = r2(sub * 0.05)
  return r2(sub + ship + tax)
}

const addr = (name) => ({
  name,
  email: 'smoke' + Date.now() + Math.random().toString(36).slice(2, 6) + '@poorprice.com',
  phone: '4165550123',
  line1: '1 Test St',
  city: 'Toronto',
  province: 'ON',
  postalCode: 'M5V 1A1',
  country: 'Canada',
})

const post = (p, body, extra = {}) =>
  j(p, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(extra.headers || {}) },
    body: JSON.stringify(body),
  })

console.log('\n=== Poorprice commerce smoke test ===\n')

/* ---------------------------------------------------------------- catalogue */
const pl = await j('/api/products?limit=50&noview=1')
ok('products list responds 200', pl.s === 200)
const all = (pl.d?.products || pl.d?.items || pl.d || []).filter(
  (p) => p && p._id && !p.priceOnRequest && p.price > 0
)
ok('catalogue has buyable products', all.length > 0)
const big = all.find((p) => p.price >= 150) || all[0]
const small = all.find((p) => p.price < 150)
console.log('       big   : ' + big.title + '  $' + big.price)
console.log('       small : ' + (small ? small.title + '  $' + small.price : 'n/a'))

/* ----------------------------------------------------------- payment config */
const pc = await j('/api/payments/config')
ok('payments config responds 200', pc.s === 200)
ok('currency is CAD', pc.d.currency === 'CAD')
// Naming an env var is not leaking it: `PAYPAL_CLIENT_SECRET` in `envVars` is a
// *name* published on purpose — it is the whole point of that field. What must
// never appear is a secret *value*: a Stripe key prefix, or any token-shaped run.
// Only string values are scanned, since key names (`freeShippingOver`) are not
// secrets and are not what this guard is about.
const configStrings = []
const collectStrings = (v) => {
  if (typeof v === 'string') configStrings.push(v)
  else if (Array.isArray(v)) v.forEach(collectStrings)
  else if (v && typeof v === 'object') Object.values(v).forEach(collectStrings)
}
collectStrings(pc.d)
const publishedNames = new Set((pc.d.unavailable ?? []).flatMap((u) => u.envVars ?? []))
const configValues = configStrings.filter((s) => !publishedNames.has(s)).join('\n')
ok('no secrets leaked by config endpoint', !/sk_live_|sk_test_|whsec_/i.test(configValues))
ok('config exposes no token-shaped value', !/[A-Za-z0-9_-]{16,}/.test(configValues))
ok('shipping + tax rules published', pc.d.shippingFlat === 14.99 && pc.d.taxRate === 0.05)
ok('config reports which gateways are unavailable', Array.isArray(pc.d.unavailable))
// Checkout lists Stripe and PayPal as selectable options even when they can't be
// used, so every gateway that isn't offered must appear in `unavailable` with a
// reason: "you never added keys" and "your keys don't work" need different fixes
// and must never look alike.
const offered = new Set(pc.d.providers.map((p) => p.id))
for (const id of ['stripe', 'paypal']) {
  if (offered.has(id)) continue
  const u = (pc.d.unavailable ?? []).find((x) => x.id === id)
  ok(
    `${id} is listed as unavailable with a reason`,
    !!u && ['not-configured', 'rejected'].includes(u.reason)
  )
  ok(
    `${id} carries a label and the env vars to set`,
    !!u?.label && (u?.envVars?.length ?? 0) > 0
  )
  ok(`${id} rejected flag matches its reason`, u?.rejected === (u?.reason === 'rejected'))
}
for (const u of pc.d.unavailable ?? []) {
  ok(`${u.id} is absent from the offered providers`, !offered.has(u.id))
  // The reason is published to the browser, so no key-shaped string may ride along.
  // Stripe quotes the credential back in its error message, so this is a real risk.
  ok(`${u.id} unavailable detail leaks no credential`, !/[A-Za-z0-9_-]{16,}/.test(u.detail ?? ''))
}
/* --- test-environment requirement ----------------------------------------- */
/*
 * Everything below exercises the order lifecycle, which needs a provider that
 * settles synchronously in-process. Only `demo` does: Stripe and PayPal hand the
 * shopper off to a hosted page this script cannot drive. The default
 * `PAYMENTS_DEMO=auto` deliberately hides demo the moment a real gateway works,
 * so require demo up front instead of reporting a cascade of misleading
 * failures further down.
 */
if (!pc.d.providers.some((p) => p.id === 'demo')) {
  console.log('\n  FATAL: no demo provider is offered, so checkout cannot be exercised.')
  console.log('  Start the server with PAYMENTS_DEMO=on, e.g.')
  console.log('    PAYMENTS_DEMO=on node node_modules/next/dist/bin/next start -p 3123')
  console.log('  (`auto` intentionally hides demo whenever a real gateway works.)')
  process.exit(1)
}

// Demo's one-liner still has to describe reality: saying "no keys configured"
// while a rejected key sits in .env.local sends people hunting in the wrong place.
const anyRejected = (pc.d.unavailable ?? []).some((u) => u.rejected)
const demoOffer = pc.d.providers.find((p) => p.id === 'demo')
ok(
  'demo note describes why checkout is simulated',
  anyRejected ? /rejected/i.test(demoOffer.note) : /no gateway keys/i.test(demoOffer.note)
)

// A real gateway must report the mode its key implies, so a sandbox charge is
// never mistaken for a live one.
for (const p of pc.d.providers) {
  if (p.id === 'demo') continue
  ok(`${p.id} reports a real mode`, ['sandbox', 'live'].includes(p.mode))
  ok(`${p.id} carries a note`, p.note.length > 0)
  if (p.mode === 'sandbox') {
    ok(`${p.id} note warns this is not a real charge`, /sandbox|test mode/i.test(p.note))
  }
}
console.log('       providers: ' + pc.d.providers.map((x) => x.id + ':' + x.mode).join(', '))

/* ------------------------------------------------------- guest checkout --- */
const ck = await post('/api/checkout', {
  items: [{ product: big._id, quantity: 2 }],
  provider: 'demo',
  shippingAddress: addr('Smoke Tester'),
})
ok('guest checkout accepted', ck.s === 200 || ck.s === 201)
ok('orderId returned', !!ck.d?.orderId)
ok('human order number returned (PP-xxxxxx)', /^PP-/.test(ck.d?.orderNumber || ''))
ok('guest receives an accessToken', typeof ck.d?.accessToken === 'string' && ck.d.accessToken.length > 10)
ok('demo order settled immediately', ck.d?.order?.payment?.status === 'paid')
ok('line items copied onto the order', (ck.d?.order?.items || []).length === 1)
console.log('       ' + ck.d?.orderNumber + '  total=$' + ck.d?.order?.total)

/* ------------------------------------------------------------ order maths */
ok('subtotal = price x qty', Math.abs(ck.d?.order?.subtotal - r2(big.price * 2)) < 0.01)
ok('total matches server maths (' + expectTotal(big.price, 2) + ')', Math.abs(ck.d?.order?.total - expectTotal(big.price, 2)) < 0.01)
ok('free shipping applied over $150', ck.d?.order?.shipping === 0)
ok('tax is 5% of subtotal', Math.abs(ck.d?.order?.tax - r2(big.price * 2 * 0.05)) < 0.01)

if (small) {
  const c2 = await post('/api/checkout', {
    items: [{ product: small._id, quantity: 1 }],
    provider: 'demo',
    shippingAddress: addr('Small Buyer'),
  })
  ok('flat shipping charged under $150', c2.d?.order?.shipping === 14.99)
  ok('cheap order total correct', Math.abs(c2.d?.order?.total - expectTotal(small.price, 1)) < 0.01)
  console.log('       cheap total=$' + c2.d?.order?.total + ' (expected $' + expectTotal(small.price, 1) + ')')
}

/* ------------------------------------------------- real gateway hand-off --- */
/*
 * The credential check proves a key authenticates; this proves the call the
 * shopper actually depends on — opening a hosted checkout session. A key that
 * passes /v1/balance but is restricted, or an amount/currency Stripe won't
 * accept, fails here with 502 instead of silently at the gateway.
 */
if (offered.has('stripe')) {
  const sc = await post('/api/checkout', {
    items: [{ product: big._id, quantity: 1 }],
    provider: 'stripe',
    shippingAddress: addr('Stripe Buyer'),
  })
  ok('stripe checkout accepted', sc.s === 200)
  ok('stripe hands off instead of settling', sc.d?.mode === 'redirect')
  ok(
    'stripe returns a hosted checkout URL',
    /^https:\/\/checkout\.stripe\.com\//.test(sc.d?.url ?? '')
  )
  ok('stripe hand-off carries the order number', /^PP-/.test(sc.d?.orderNumber ?? ''))
  ok('stripe hand-off carries an accessToken', typeof sc.d?.accessToken === 'string')

  // Nothing has been charged yet, so the order must not read as paid.
  const so = await j(
    '/api/orders/' + sc.d.orderId + '?token=' + encodeURIComponent(sc.d.accessToken)
  )
  ok('handed-off order is not paid yet', so.d?.order?.payment?.status === 'unpaid')
  ok('handed-off order records the stripe provider', so.d?.order?.payment?.provider === 'stripe')
  ok(
    'handed-off order is priced from the database',
    Math.abs(so.d?.order?.total - expectTotal(big.price, 1)) < 0.01
  )
  console.log('       stripe ' + sc.d?.orderNumber + ' -> ' + (sc.d?.url || '').slice(0, 46) + '…')
} else {
  console.log('       (stripe not offered on this server — hand-off not exercised)')
}

/* --------------------------------------------------------- access control */
const g = await j('/api/orders/' + ck.d.orderId)
ok('unauthenticated order read blocked', g.s === 401 || g.s === 403)
const badTok = await j('/api/orders/' + ck.d.orderId + '?token=deadbeef')
ok('wrong accessToken rejected', badTok.s === 401 || badTok.s === 403)
const goodTok = await j('/api/orders/' + ck.d.orderId + '?token=' + encodeURIComponent(ck.d.accessToken))
ok('correct accessToken grants read', goodTok.s === 200)
ok('accessToken never echoed back in body', !JSON.stringify(goodTok.d).includes(ck.d.accessToken))

/* ------------------------------------------------- confirm is idempotent */
// A guest must prove ownership with the accessToken — confirming without it is
// refused, so an attacker who guesses an order id cannot settle someone's order.
const cfNoAuth = await post('/api/checkout/confirm', { orderId: ck.d.orderId })
ok('confirm without accessToken refused', cfNoAuth.s === 403 || cfNoAuth.s === 401)

const cf = await post('/api/checkout/confirm', {
  orderId: ck.d.orderId,
  accessToken: ck.d.accessToken,
})
ok('confirm idempotent on already-paid order', cf.s === 200 && cf.d?.order?.payment?.status === 'paid')

/* -------------------------------------------------------- accounts ------- */
const em = 'new' + Date.now() + '@poorprice.com'
const su = await post('/api/account/signup', { name: 'New Buyer', email: em, password: 'secret123' })
ok('signup accepted', su.s === 200 || su.s === 201)
const cookie = (su.h.get('set-cookie') || '').split(';')[0]
ok('member session cookie set', cookie.includes('kijiji_session'))
ok('member cookie is a separate realm from admin', !cookie.includes('kijiji_admin_session'))
const me = await j('/api/account/me', { headers: { cookie } })
ok('me returns the signed-up member', me.s === 200 && me.d?.member?.email === em)
ok('password hash never returned', !JSON.stringify(me.d).match(/passwordHash|\$2[aby]\$|password/))

const dup = await post('/api/account/signup', { name: 'Dup', email: em, password: 'secret123' })
ok('duplicate email rejected', dup.s === 409 || dup.s === 400)

const bad = await post('/api/account/login', { email: em, password: 'WRONG' })
ok('wrong password rejected with 401', bad.s === 401)

const good = await post('/api/account/login', { email: em, password: 'secret123' })
ok('correct password accepted', good.s === 200)
ok('login issues member cookie', (good.h.get('set-cookie') || '').includes('kijiji_session'))

/* ------------------------------------------- wrong-door detection ------- */
// Storefront and admin are separate sign-ins. Staff credentials are perfectly
// valid — just not here — so the member endpoint should say so instead of a
// dead-end "invalid email or password".
const adminEmail = process.env.ADMIN_EMAIL || 'admin@kijiji.local'
const adminPass = process.env.ADMIN_PASSWORD || 'admin123'

const staffAtMember = await post('/api/account/login', {
  email: adminEmail,
  password: adminPass,
})
ok('staff credentials at member sign-in return 403', staffAtMember.s === 403)
ok('response flags the admin sign-in route', staffAtMember.d?.useAdminSignIn === true)
ok(
  'the message points at the admin panel',
  /staff account/i.test(staffAtMember.d?.error || '')
)

const staffAtAdmin = await post('/api/auth/login', { email: adminEmail, password: adminPass })
ok('the same credentials work at the admin sign-in', staffAtAdmin.s === 200)

// The hint must not leak account existence: it may only appear once the password
// is actually correct for a staff account.
const unknown = await post('/api/account/login', {
  email: 'nobody' + Date.now() + '@example.com',
  password: adminPass,
})
ok('unknown email stays generic', unknown.s === 401 && !unknown.d?.useAdminSignIn)

const staffWrongPass = await post('/api/account/login', {
  email: adminEmail,
  password: 'definitely-not-the-password',
})
ok(
  'staff email with a wrong password stays generic',
  staffWrongPass.s === 401 && !staffWrongPass.d?.useAdminSignIn
)

const noAuth = await j('/api/account/orders')
ok('order history requires a session', noAuth.s === 401)
const hist = await j('/api/account/orders', { headers: { cookie } })
ok('order history readable when signed in', hist.s === 200)

/* ---------------------------------------------------- tamper resistance -- */
const tam = await post('/api/checkout', {
  items: [{ product: big._id, quantity: 1, price: 0.01 }],
  provider: 'demo',
  shippingAddress: addr('Tamper'),
})
ok('client-supplied price ignored', Math.abs(tam.d?.order?.total - expectTotal(big.price, 1)) < 0.01)
console.log('       tampered total=$' + tam.d?.order?.total + ' (expected $' + expectTotal(big.price, 1) + ')')

const badQty = await post('/api/checkout', {
  items: [{ product: big._id, quantity: 0 }],
  provider: 'demo',
  shippingAddress: addr('Zero'),
})
ok('quantity 0 rejected', badQty.s === 422)

const badAddr = await post('/api/checkout', {
  items: [{ product: big._id, quantity: 1 }],
  provider: 'demo',
  shippingAddress: { name: 'A' },
})
ok('incomplete address rejected', badAddr.s === 422)

/* A gateway the server does not offer must be refused by the API, not silently
   accepted: the checkout UI blocks it, but the endpoint is what an attacker
   actually talks to. Asserted for every provider id, so this keeps its meaning
   as keys come and go — and it is the check that catches `demo` being honoured
   on a live site while the UI hides it. */
const unoffered = ['stripe', 'paypal', 'demo'].filter((id) => !offered.has(id))
if (unoffered.length === 0) console.log('       (every provider is offered — nothing to refuse)')
for (const id of unoffered) {
  const r = await post('/api/checkout', {
    items: [{ product: big._id, quantity: 1 }],
    provider: id,
    shippingAddress: addr('Refused Gateway'),
  })
  ok(`${id} (not offered) refused, not silently accepted`, r.s === 400 || r.s === 502)
  console.log('       ' + id + ' attempt -> ' + r.s + ' ' + JSON.stringify(r.d).slice(0, 90))
}

/* ------------------------------------------------------------- admin API - */
// Both of these are staff-only surfaces; anonymous callers must be turned away.
const adminOrders = await j('/api/orders')
ok('admin order list requires staff session', adminOrders.s === 401 || adminOrders.s === 403)

const stats = await j('/api/stats')
ok('dashboard stats require staff session', stats.s === 401 || stats.s === 403)

/* -------------------------------------------- staff session + order admin */
const adminLogin = await post('/api/auth/login', {
  email: process.env.ADMIN_EMAIL || 'admin@kijiji.local',
  password: process.env.ADMIN_PASSWORD || 'admin123',
})
if (adminLogin.s === 200) {
  const adminCookie = (adminLogin.h.get('set-cookie') || '').split(';')[0]
  ok('staff login issues admin cookie', adminCookie.includes('kijiji_admin_session'))

  const statsAuth = await j('/api/stats', { headers: { cookie: adminCookie } })
  ok('staff can read dashboard stats', statsAuth.s === 200)
  ok('stats expose order counters', typeof statsAuth.d?.orders?.total === 'number')
  ok('stats expose revenue', typeof statsAuth.d?.orders?.revenue === 'number')
  ok('stats expose member count', typeof statsAuth.d?.members?.total === 'number')
  console.log(
    '       orders=' +
      statsAuth.d?.orders?.total +
      ' paid=' +
      statsAuth.d?.orders?.paid +
      ' revenue=$' +
      r2(statsAuth.d?.orders?.revenue || 0) +
      ' members=' +
      statsAuth.d?.members?.total
  )

  const list = await j('/api/orders', { headers: { cookie: adminCookie } })
  ok('staff can list orders', list.s === 200)
  const orders = list.d?.items || []
  ok('order list is paginated', typeof list.d?.total === 'number' && Array.isArray(list.d?.items))
  ok('staff order list includes the guest order', orders.some((o) => String(o.id) === ck.d.orderId))
  ok('staff order list never leaks accessToken', !JSON.stringify(list.d).includes(ck.d.accessToken))

  // Advance one order through the fulfilment pipeline.
  const target = orders.find((o) => String(o.id) === ck.d.orderId)
  if (target) {
    const patch = await j('/api/orders/' + ck.d.orderId, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ status: 'processing' }),
    })
    ok('staff can advance order status', patch.s === 200)
    ok('status actually changed to processing', patch.d?.order?.status === 'processing')
    console.log('       order ' + ck.d?.orderNumber + ' -> processing')
  }

  // A member cookie must NOT unlock the staff surface.
  const crossRealm = await j('/api/orders', { headers: { cookie } })
  ok('member cookie does not unlock staff order list', crossRealm.s === 401 || crossRealm.s === 403)
} else {
  console.log('  ..   staff login unavailable (' + adminLogin.s + '), skipping admin checks')
}

/* ----------------------------------------------------------------- report */
console.log('\n' + pass + '/' + (pass + fail) + ' checks passed')
if (failures.length) {
  console.log('\nFailed:')
  failures.forEach((f) => console.log('  - ' + f))
}
process.exit(fail ? 1 : 0)
