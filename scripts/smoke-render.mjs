/**
 * Server-rendered HTML checks for the storefront.
 *
 * Catches the failure mode where a page compiles but throws at render time,
 * which an HTTP 200 alone would not reveal.
 */

const B = process.env.BASE_URL || 'http://localhost:3123'

let pass = 0
let fail = 0

const ok = (name, cond, detail) => {
  if (cond) {
    pass++
    console.log('  ok   ' + name)
  } else {
    fail++
    console.log('  FAIL ' + name + (detail ? '  -> ' + detail : ''))
  }
}

const get = async (p) => {
  const r = await fetch(B + p)
  const html = await r.text()
  return { s: r.status, html }
}

/** A page that blew up at render time still returns 200 in dev — look for the tell-tales. */
const looksBroken = (html) =>
  /Application error|Internal Server Error|Unhandled Runtime Error|This page could not be found|__next_error__/i.test(
    html
  )

console.log('\n=== Poorprice page render checks ===\n')

/* ---- find a buyable listing ---- */
const api = await fetch(B + '/api/products?limit=50&noview=1').then((r) => r.json())
const prods = (api?.products || api?.items || api || []).filter(
  (p) => p && p._id && !p.priceOnRequest && p.price > 0
)
const p = prods[0]

const pages = [
  ['/', '/'],
  ['/browse', '/browse'],
  ['/cart', '/cart'],
  ['/checkout', '/checkout'],
  ['/signin', '/signin'],
  ['/signup', '/signup'],
  ['/account', '/account'],
  ['/wishlist', '/wishlist'],
  ['/listing/' + p._id, '/listing/[id]'],
]

const bodies = {}
for (const [path, label] of pages) {
  const r = await get(path)
  bodies[label] = r.html
  ok(label + ' returns 200', r.s === 200, 'status ' + r.s)
  ok(label + ' rendered without an error page', !looksBroken(r.html))
}

/* ---- header chrome on every page ---- */
const home = bodies['/']
ok('header shows a cart link', /href="\/cart"/.test(home))
// AccountMenu deliberately renders a neutral placeholder during SSR and swaps in
// the real link/trigger after hydration, so accept either form here.
ok(
  'header mounts the account menu',
  /account-menu-placeholder|account-signin-link|account-menu-trigger|href="\/signin"/.test(home)
)
ok('brand is Poorprice, not Kijiji', /Poorprice/i.test(home))
ok('no stray Kijiji branding on the homepage', !/>\s*Kijiji\s*</.test(home))
ok('header links to the wishlist', /href="\/wishlist"/.test(home))

/* ---- wishlist page shell ---- */
const wish = bodies['/wishlist']
ok('wishlist page renders its heading', /Favourites/i.test(wish))
ok('wishlist page defers the saved items to the client', /wishlist-card-skeleton/.test(wish))

/* ---- listing page: the buy box is client-rendered ---- */
const listing = bodies['/listing/[id]']
ok('listing shell renders', listing.includes('Poorprice'))
ok('listing defers the product panel to the client', /Loading listing/i.test(listing))

/* ---- auth pages ---- */
ok('signin page has an email field', /type="email"/i.test(bodies['/signin']))
ok('signin page has a password field', /type="password"/i.test(bodies['/signin']))
ok('signup page has a name field', /name="name"|Create account/i.test(bodies['/signup']))
ok('signup page has a password field', /type="password"/i.test(bodies['/signup']))

/* ---- checkout ---- */
const checkout = bodies['/checkout']
ok('checkout renders a form', /<form/i.test(checkout))
ok('checkout mentions the payment step', /payment/i.test(checkout))

/* ---- static assets ---- */
// Use the href exactly as the page emits it. Production serves a hashed name
// (`/_next/static/css/<hash>.css`) while dev serves an unhashed path with a
// cache-busting query (`/_next/static/css/app/layout.css?v=…`), so rebuilding
// the path from the filename only works in one of them.
const cssHref = (home.match(/\/_next\/static\/css\/[^"]+?\.css/) || [''])[0]
ok('page links a stylesheet', cssHref !== '')
const css = await fetch(B + cssHref)
ok('stylesheet is served', css.status === 200 && css.headers.get('content-type')?.includes('css'))
const cssBody = await css.text()
ok('stylesheet carries the commerce styles', /buy-box|cart-line|checkout/i.test(cssBody))
console.log('       css bytes: ' + cssBody.length)

console.log('\n' + pass + '/' + (pass + fail) + ' checks passed')
process.exit(fail ? 1 : 0)
