/**
 * Real-browser verification of the storefront purchase flow.
 *
 * The listing, cart and checkout pages are client-rendered, so a server-side
 * HTML fetch cannot prove they work. This drives actual Chromium through the
 * whole journey: browse -> add to cart -> checkout -> confirmation, plus the
 * member and admin surfaces.
 *
 * Timeouts are deliberately generous: this suite also runs against `next dev`
 * (BASE_URL=http://localhost:3000), which compiles each route on first request
 * and can take tens of seconds to answer.
 *
 * Uses the cached Chromium that ships with the environment and the
 * playwright-core copy in the managed node workspace (resolved via
 * createRequire, because ESM ignores NODE_PATH).
 */

import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const WORKSPACE = 'C:/Users/Admin/.workbuddy-ai/binaries/node/workspace'
const require = createRequire(join(WORKSPACE, 'noop.cjs'))
const { chromium } = require('playwright-core')

const B = process.env.BASE_URL || 'http://localhost:3123'
const SHOTS = process.env.SHOT_DIR || 'C:/Users/Admin/Desktop/kijiji-clone/.shots'
mkdirSync(SHOTS, { recursive: true })

let pass = 0
let fail = 0
const failures = []

const ok = (name, cond, detail) => {
  if (cond) {
    pass++
    console.log('  ok   ' + name)
  } else {
    fail++
    failures.push(name)
    console.log('  FAIL ' + name + (detail ? '  -> ' + detail : ''))
  }
}

const browser = await chromium.launch({
  executablePath: 'C:/Users/Admin/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args: ['--no-sandbox'],
})

const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
const page = await ctx.newPage()

const consoleErrors = []
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

// Track which requests actually failed, so we can tell a benign "am I signed in?"
// 401 apart from a genuine breakage.
const failedRequests = []
page.on('response', (r) => {
  if (r.status() >= 400) failedRequests.push(r.status() + ' ' + r.url())
})

const shot = (name) => page.screenshot({ path: join(SHOTS, name + '.png'), fullPage: false })

console.log('\n=== Poorprice browser flow ===\n')

/* ------------------------------------------------ pick a buyable product */
const api = await fetch(B + '/api/products?limit=50&noview=1').then((r) => r.json())
const prods = (api?.products || api?.items || api || []).filter(
  (p) => p && p._id && !p.priceOnRequest && p.price > 0
)
// Prefer a cheap item so shipping is charged and the maths is easy to read.
const product = prods.find((p) => p.price < 150) || prods[0]
console.log('       product: ' + product.title + '  $' + product.price)

/* -------------------------------------------------------- listing + buybox */
await page.goto(B + '/listing/' + product._id, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.buybox', { timeout: 60000 })
const buyText = await page.locator('.buybox').innerText()
ok('listing renders the buy box', await page.locator('.buybox').isVisible())
// priceLabel() renders whole dollars (maximumFractionDigits: 0), e.g. "$9,700".
ok('buy box shows the formatted price', /\$[\d,]+/.test(buyText))
ok('buy box offers Add to cart', /add to cart/i.test(buyText))
ok('buy box offers Buy it now', /buy it now/i.test(buyText))
ok('buy box states the shipping threshold', /free shipping/i.test(buyText))
ok('buy box shows a secure-checkout reassurance', /secure checkout/i.test(buyText))
ok('buy box renders payment provider marks', (await page.locator('.buybox svg').count()) >= 2)
await shot('01-listing-buybox')

/* ----------------------------------------------------------- wishlist */
// The favourite button carries an aria-label, so target it by class rather than
// by accessible name (which is "Save X to favourites", not the visible text).
const favBtn = page.locator('.buybox-favorite').first()
ok('buy box offers Add to favourites', (await favBtn.count()) > 0)
ok('favourite button starts unsaved', (await page.locator('.buybox-favorite.is-saved').count()) === 0)

await favBtn.click()
await page.waitForSelector('.header-wishlist-badge', { timeout: 60000 })
const wBadge = (await page.locator('.header-wishlist-badge').innerText()).trim()
ok('header wishlist badge appears after saving', wBadge === '1', 'badge="' + wBadge + '"')
ok('favourite button shows the saved state', (await page.locator('.buybox-favorite.is-saved').count()) === 1)
ok('saved button reports aria-pressed', (await favBtn.getAttribute('aria-pressed')) === 'true')

// The listing toolbar's own Save button drives the same wishlist, so the two
// affordances must never disagree.
const toolbarSave = page.locator('.detail-action-bar .action-outline-btn').first()
ok('listing toolbar has a Save button', (await toolbarSave.count()) > 0)
ok('toolbar Save reflects the saved state', (await toolbarSave.innerText()).trim() === 'Saved')
await toolbarSave.click()
await page.waitForTimeout(1000)
ok('toolbar Save unsaves the same item', (await page.locator('.buybox-favorite.is-saved').count()) === 0)
ok('badge clears when unsaved from the toolbar', (await page.locator('.header-wishlist-badge').count()) === 0)
// Save it again so the rest of the wishlist flow has something to work with.
await favBtn.click()
await page.waitForSelector('.header-wishlist-badge', { timeout: 60000 })
ok('re-saving from the buy box works', (await page.locator('.header-wishlist-badge').innerText()).trim() === '1')

await shot('10-wishlist-saved')

// The user asked for the wishlist icon to sit immediately after the cart.
const headerLinks = await page
  .locator('.account-actions a')
  .evaluateAll((els) => els.map((e) => e.getAttribute('href')))
const cartIdx = headerLinks.indexOf('/cart')
const wishIdx = headerLinks.indexOf('/wishlist')
ok(
  'wishlist icon sits immediately after the cart in the header',
  cartIdx >= 0 && wishIdx === cartIdx + 1,
  JSON.stringify(headerLinks)
)

await page.goto(B + '/wishlist', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.wishlist-card', { timeout: 90000 })
await page.waitForTimeout(800)
const wText = await page.locator('body').innerText()
ok('wishlist page lists the saved product', wText.includes(product.title.slice(0, 20)))
ok('wishlist page shows a price', /\$[\d,]+/.test(wText))
ok('wishlist page is not showing the empty state', !/no favourites yet/i.test(wText))
await shot('11-wishlist-page')

// Favourites must outlive a refresh, like the cart.
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.wishlist-card', { timeout: 90000 })
await page.waitForTimeout(600)
ok('wishlist survives a reload', (await page.locator('.wishlist-card').count()) > 0)

await page.locator('.wishlist-remove').first().click()
await page.waitForTimeout(1400)
ok(
  'removing the last favourite shows the empty state',
  /no favourites yet/i.test(await page.locator('body').innerText())
)
ok('badge disappears once the wishlist is emptied', (await page.locator('.header-wishlist-badge').count()) === 0)

/* --------------------------------------------------------- add to cart */
// Back to the listing — the wishlist detour left us on /wishlist.
await page.goto(B + '/listing/' + product._id, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.buybox', { timeout: 60000 })
await page.getByRole('button', { name: /add to cart/i }).first().click()
await page.waitForSelector('.header-cart-badge', { timeout: 60000 })
const badgeText = (await page.locator('.header-cart-badge').innerText()).trim()
ok('header cart badge shows a count after add', badgeText === '1', 'badge="' + badgeText + '"')

// Add a second unit via the quantity stepper.
const plus = page.locator('.buybox-qty-row button').last()
if (await plus.count()) {
  await plus.click()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /add to cart/i }).first().click()
  await page.waitForTimeout(900)
  const b2 = (await page.locator('.header-cart-badge').innerText()).trim()
  ok('adding again increases the badge', Number(b2) === 3, 'badge="' + b2 + '"')
}

/* ------------------------------------------------------------- cart page */
await page.goto(B + '/cart', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.cart-row', { timeout: 90000 })
await page.waitForTimeout(800)
const cartText = await page.locator('body').innerText()
ok('cart lists the added product', cartText.includes(product.title.slice(0, 20)))
ok('cart shows a subtotal', /subtotal/i.test(cartText))
ok('cart shows shipping', /shipping/i.test(cartText))
ok('cart shows tax', /tax/i.test(cartText))
ok('cart shows a total', /total/i.test(cartText))
ok('cart offers a checkout action', /checkout/i.test(cartText))
ok('cart is not showing the empty state', !/your cart is empty/i.test(cartText))
const expectedSub = product.price * 3
ok(
  'cart subtotal matches 3 units',
  new RegExp('\\$' + expectedSub.toLocaleString('en-CA') + '\\.00').test(cartText) ||
    cartText.includes(String(expectedSub)),
  'looking for ' + expectedSub
)
await shot('02-cart')

/* --------------------------------------------------------- checkout page */
await page.getByRole('link', { name: /checkout/i }).first().click()
await page.waitForURL(/checkout/, { timeout: 90000 })
await page.waitForSelector('.checkout-card', { timeout: 90000 })
await page.waitForTimeout(2000)
const checkoutText = await page.locator('body').innerText()
ok('checkout renders the shipping step', /shipping/i.test(checkoutText))
ok('checkout renders the payment step', /payment method/i.test(checkoutText))
ok('checkout lists the available provider', (await page.locator('.pay-method').count()) >= 1)
ok('checkout shows the order summary', /total/i.test(checkoutText))
ok('checkout reassures about card data', /never stores card numbers/i.test(checkoutText))

const cfg = await fetch(B + '/api/payments/config').then((r) => r.json())

/* This suite drives the whole purchase, which only works with a provider that
   settles in-process and returns to /checkout/success. Stripe and PayPal both
   hand off to their own hosted page, so demo is required — the same preflight
   guards smoke-commerce.mjs. Without it the run would fail much later, on the
   confirmation page, with a misleading error. */
if (!cfg.providers.some((p) => p.id === 'demo')) {
  console.log('\n  FATAL: no demo provider is offered, so the purchase cannot be driven.')
  console.log('  Start the server with PAYMENTS_DEMO=on.')
  console.log('  (`auto` intentionally hides demo whenever a real gateway works.)')
  await browser.close()
  process.exit(1)
}

/* Both real gateways are always offered as options, working or not: the client
   asked to be able to pick Stripe or PayPal directly and see the problem rather
   than have the method silently disappear. */
for (const id of ['stripe', 'paypal']) {
  ok(`${id} appears as a checkout option`, (await page.locator(`.pay-method input[value="${id}"]`).count()) > 0)
  if (!cfg.providers.some((p) => p.id === id)) {
    ok(
      `${id} option is marked unavailable`,
      (await page.locator(`.pay-method.is-unavailable input[value="${id}"]`).count()) > 0
    )
  }
}

/* Selecting a broken gateway must explain itself, and must not be able to place
   an order — a method that can't charge must never produce a "paid" order.
   "No keys at all" and "the gateway refused the keys" are different problems
   needing different fixes, so both cases are asserted separately. */
const brokenIds = ['stripe', 'paypal'].filter((id) => !cfg.providers.some((p) => p.id === id))
/* The end-to-end completion below needs a provider that settles in-process and
   lands back on /checkout/success. Stripe and PayPal both navigate away to their
   own hosted page, so prefer demo whenever it is offered — it is the only one
   whose whole flow this script can drive. */
const demoId = cfg.providers.find((p) => p.id === 'demo')?.id
const workingId = demoId ?? cfg.providers[0]?.id

for (const brokenId of brokenIds) {
  const info = (cfg.unavailable ?? []).find((u) => u.id === brokenId)
  await page.locator(`.pay-method input[value="${brokenId}"]`).check()
  await page.waitForTimeout(400)

  const problem = page.locator('.pay-problem')
  const shown = (await problem.count()) > 0
  ok(`selecting ${brokenId} explains the problem`, shown)
  const problemText = shown ? await problem.innerText() : ''

  ok(
    `${brokenId} explanation names the env var to fix`,
    /STRIPE_SECRET_KEY|PAYPAL_CLIENT_ID/.test(problemText)
  )
  ok(
    `order is blocked while ${brokenId} is selected`,
    await page.locator('.cart-checkout-btn').isDisabled()
  )
  ok(
    `checkout says why the order is blocked for ${brokenId}`,
    (await page.locator('.checkout-blocked').count()) > 0
  )

  if (info?.reason === 'rejected') {
    ok(`${brokenId} explanation says the gateway refused the keys`, /rejected/i.test(problemText))
    ok(`${brokenId} explanation points at check:gateways`, /check:gateways/.test(problemText))
  } else {
    ok(`${brokenId} explanation says the keys are missing`, /add/i.test(problemText))
    ok(`${brokenId} explanation does not blame the gateway`, !/refused/i.test(problemText))
  }

  // Bring the explanation into frame: the screenshot is the evidence the client
  // reads, and the payment section sits below the fold on a laptop viewport.
  if (shown) await problem.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  await shot(`13-checkout-${brokenId}-unavailable`)
}

// ...and switching back to a working method must clear all of it.
if (workingId) {
  await page.locator(`.pay-method input[value="${workingId}"]`).check()
  await page.waitForTimeout(400)
  ok('choosing a working method re-enables the order', !(await page.locator('.cart-checkout-btn').isDisabled()))
  ok('the problem notice clears', (await page.locator('.pay-problem').count()) === 0)
}

// The demo notice must describe the ACTUAL reason checkout is simulated. Saying
// "no gateway keys are configured" while a rejected key sits in .env.local sends
// people hunting in the wrong place, so assert whichever case is true here.
// The notice only exists when demo is offered at all — with `auto` and a working
// gateway there is none, and nothing to check.
const rejected = (cfg.unavailable ?? []).filter((u) => u.rejected)
const demoInfo = cfg.providers.find((p) => p.id === 'demo')
if (demoInfo && rejected.length > 0) {
  ok(
    'demo notice names the rejected credentials (' + rejected.map((r) => r.id).join(', ') + ')',
    /credentials were rejected/i.test(checkoutText)
  )
  ok('demo notice does not claim no keys exist', !/no gateway keys are configured/i.test(checkoutText))
} else if (cfg.anyLive) {
  // `auto` hides demo the moment a gateway works; PAYMENTS_DEMO=on keeps it
  // alongside one. Either is valid, but a demo option must never be presented
  // as a real charge.
  ok('demo is hidden unless explicitly forced on', !demoInfo || /simulated/i.test(demoInfo.note))
} else if (demoInfo) {
  ok('demo notice says no keys are configured', /no gateway keys are configured/i.test(checkoutText))
}

await shot('03-checkout')

/* ------------------------------------------- complete a guest checkout */
const email = 'browser' + Date.now() + '@poorprice.com'
const fill = async (label, value) => {
  const f = page.getByLabel(label, { exact: false }).first()
  if (await f.count()) {
    await f.fill(value)
    return true
  }
  return false
}

let filled = 0
if (await fill('Full name', 'Browser Tester')) filled++
if (await fill('Email', email)) filled++
if (await fill('Phone', '4165550123')) filled++
if (await fill('Street address', '1 Browser Way')) filled++
if (await fill('City', 'Toronto')) filled++
if (await fill('Postal code', 'M5V2T6')) filled++
ok('shipping form accepted input', filled >= 5, filled + ' of 6 fields filled')

// Option values are full province names, not two-letter codes.
const provSel = page.getByLabel('Province', { exact: false }).first()
if (await provSel.count()) await provSel.selectOption('Ontario')

const placeBtn = page.getByRole('button', { name: /place order/i }).first()
ok('checkout exposes a Place order button', (await placeBtn.count()) > 0)

// Be explicit about which provider is selected at submit time rather than relying
// on whichever radio a previous block happened to leave checked.
if (demoId) {
  await page.locator(`.pay-method input[value="${demoId}"]`).check()
  await page.waitForTimeout(300)
}
await placeBtn.click()

await page.waitForURL(/checkout\/success/, { timeout: 60000 })
await page.waitForSelector('.confirm-card', { timeout: 90000 })
await page.waitForTimeout(1200)
const after = await page.locator('body').innerText()
ok('order submits and reaches the confirmation page', /checkout\/success/.test(page.url()))
ok('confirmation shows an order number (PP-xxxxxx)', /PP-[A-Z0-9]{6}/.test(after))
ok('confirmation shows a total', /\$[\d,]+\.\d{2}/.test(after))
ok('confirmation says the payment succeeded', /paid|thank you|confirmed/i.test(after))
console.log('       ' + (after.match(/PP-[A-Z0-9]{6}/) || ['(no order number)'])[0] + '  @ ' + page.url())
await shot('04-confirmation')

/* ---------------------------------------- order survives a hard refresh */
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.confirm-card', { timeout: 90000 })
await page.waitForTimeout(1000)
const afterReload = await page.locator('body').innerText()
ok('confirmation survives a page reload', /PP-[A-Z0-9]{6}/.test(afterReload))

/* --------------------------------------------------------- member flow */
await page.goto(B + '/signup', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('form', { timeout: 60000 })
// Let React hydrate before typing — filling a controlled input before the
// handlers are attached sets the DOM value but leaves state empty, and the
// submit then fails validation with "field is required".
await page.waitForTimeout(2500)
ok('signup page renders a form', (await page.locator('form').count()) > 0)
const memberEmail = 'member' + Date.now() + '@poorprice.com'
await fill('Full name', 'Member Tester')
await fill('Email', memberEmail)
// "Password" also prefix-matches "Confirm password", so target each by placeholder.
await page.getByPlaceholder(/at least 8 characters/i).first().fill('secret123')
await page.getByPlaceholder(/repeat your password/i).first().fill('secret123')
await shot('05-signup')
await page.getByRole('button', { name: /create account/i }).first().click()
await page.waitForURL(/account/, { timeout: 90000 })
await page.waitForTimeout(3000)
ok('signup lands on the account page', /\/account/.test(page.url()))

const acctText = await page.locator('body').innerText()
ok('account page greets the new member by name', acctText.includes('Member Tester'))
ok('account page shows the member email', acctText.includes(memberEmail))
ok('account page offers sign out', /sign out/i.test(acctText))
ok('account page shows the order history section', /my orders|orders/i.test(acctText))
ok('account page shows account details', /account details/i.test(acctText))
ok('account page offers a password change', /change password/i.test(acctText))
ok('account page is not the signed-out wall', !/please sign in|not authenticated/i.test(acctText))
await shot('06-account')

// The member session must survive a reload.
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
ok('member stays signed in after a reload', (await page.locator('body').innerText()).includes('Member Tester'))

// Signing out must drop only the member realm. Wait for the UI to actually drop
// it rather than guessing a delay — the sign-out call plus the session refetch is
// what takes the time, and a fixed sleep made this check fail at random.
await page.getByRole('button', { name: /sign out/i }).first().click()
await page
  .waitForFunction((email) => !document.body.innerText.includes(email), memberEmail, {
    timeout: 20000,
  })
  .catch(() => {})
const afterOut = await page.locator('body').innerText()
ok('sign out clears the member session', !afterOut.includes(memberEmail))

await page.goto(B + '/signin', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('form', { timeout: 60000 })
await page.waitForTimeout(2000)
ok('signin page renders a form', (await page.locator('form').count()) > 0)
await shot('07-signin')

/* ------------------------------------------------------------- admin */
await page.goto(B + '/admin/login', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('form', { timeout: 60000 })
await page.waitForTimeout(2500)
await fill('Email', 'admin@kijiji.local')
await fill('Password', 'admin123')
await page.getByRole('button', { name: /sign in|log in/i }).first().click()
await page.waitForTimeout(4500)
ok('staff can sign in', !/invalid|incorrect/i.test(await page.locator('body').innerText()))

await page.goto(B + '/admin/orders', { waitUntil: 'domcontentloaded' })
// The order table is client-rendered, so wait for the rows or the empty state to
// appear instead of guessing a delay — a fixed sleep made this check flaky.
await page
  .waitForFunction(
    () =>
      /PP-[A-Z0-9]{6}/.test(document.body.innerText) || /no orders/i.test(document.body.innerText),
    null,
    { timeout: 25000 }
  )
  .catch(() => {})
const adminText = await page.locator('body').innerText()
ok('admin orders page loads for staff', !/sign in/i.test(adminText) || /orders/i.test(adminText))
ok('admin orders page lists order numbers', /PP-[A-Z0-9]{6}/.test(adminText) || /no orders/i.test(adminText))
await shot('08-admin-orders')

/* --------------------------------------------------------- mobile check */
const mobile = await ctx.newPage()
await mobile.setViewportSize({ width: 390, height: 844 })
await mobile.goto(B + '/listing/' + product._id, { waitUntil: 'domcontentloaded' })
await mobile.waitForSelector('.buybox', { timeout: 60000 })
await mobile.waitForTimeout(1000)
ok('buy box renders on mobile', await mobile.locator('.buybox').isVisible())
const mHome = await mobile.goto(B + '/', { waitUntil: 'domcontentloaded' })
ok('mobile homepage responds', mHome.status() === 200)
await mobile.screenshot({ path: join(SHOTS, '09-mobile.png') })

/* ------------------------------------------------------------- console */
// A 401 from a member-scoped endpoint is how the app learns "nobody is signed
// in" — expected, and the only 4xx we tolerate. Note the order-history call is
// refetched once right after sign-out, so it legitimately 401s there too.
// Anything else is a real defect.
const PROBE = /\/api\/(account\/(me|orders)|auth\/me)($|\?)/
const unexpected = failedRequests.filter((f) => !(f.startsWith('401 ') && PROBE.test(f)))
ok('no unexpected failed requests', unexpected.length === 0, unexpected.slice(0, 3).join(' | '))

const realErrors = consoleErrors.filter((e) => {
  if (/favicon|React DevTools|preload|Download the React/i.test(e)) return false
  // The console echo of an expected probe 401.
  if (/status of 401/.test(e) && unexpected.length === 0) return false
  return true
})
ok('no unexpected browser console errors', realErrors.length === 0, realErrors.slice(0, 2).join(' | '))
if (realErrors.length) realErrors.slice(0, 5).forEach((e) => console.log('       ! ' + e.slice(0, 170)))
console.log(
  '       signed-out probes returning 401 (expected): ' +
    failedRequests.filter((f) => f.startsWith('401 ')).length
)

await browser.close()

console.log('\n' + pass + '/' + (pass + fail) + ' checks passed')
console.log('screenshots -> ' + SHOTS)
if (failures.length) {
  console.log('\nFailed:')
  failures.forEach((f) => console.log('  - ' + f))
}
process.exit(fail ? 1 : 0)
