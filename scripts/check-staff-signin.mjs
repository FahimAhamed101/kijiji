/**
 * Focused check: what a staff member sees when they try the storefront sign-in.
 * Writes .shots/12-staff-wrong-door.png
 */

import { createRequire } from 'node:module'
import { join } from 'node:path'

const WORKSPACE = 'C:/Users/Admin/.workbuddy-ai/binaries/node/workspace'
const require = createRequire(join(WORKSPACE, 'noop.cjs'))
const { chromium } = require('playwright-core')

const B = process.env.BASE_URL || 'http://localhost:3123'

let pass = 0
let fail = 0
const ok = (n, c, d) => {
  if (c) {
    pass++
    console.log('  ok   ' + n)
  } else {
    fail++
    console.log('  FAIL ' + n + (d ? '  -> ' + d : ''))
  }
}

const browser = await chromium.launch({
  executablePath: 'C:/Users/Admin/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args: ['--no-sandbox'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

console.log('\n=== staff sign-in at the wrong door ===\n')

await page.goto(B + '/signin', { waitUntil: 'networkidle' })
await page.waitForSelector('form', { timeout: 60000 })
// Wait for hydration before typing: filling a controlled input before React has
// attached its handlers sets the DOM value but leaves state empty, and the
// submit then fails validation. Dev mode makes this window much wider.
await page.waitForTimeout(2500)

ok('signin page links to the admin panel', (await page.locator('a[href="/admin/login"]').count()) > 0)
const staffNote = await page.locator('.auth-staff-note').innerText().catch(() => '')
ok('staff note is visible before any attempt', /staff/i.test(staffNote), staffNote)

await page.getByLabel('Email address').fill('bangLameta@gmail.com')
// The show/hide toggle sits inside the label, so getByLabel('Password') matches
// two elements — target the input by type instead.
await page.locator('input[type="password"]').fill('Monir59@')
await page.getByRole('button', { name: /^sign in$/i }).click()

await page.waitForSelector('.auth-alert', { timeout: 60000 })
await page.waitForTimeout(600)
const alert = await page.locator('.auth-alert').innerText()
console.log('       alert: ' + alert.replace(/\n/g, ' '))

ok('alert explains it is a staff account', /staff account/i.test(alert))
ok('alert offers a link to the admin sign-in', /admin sign-in/i.test(alert))
const href = await page.locator('.auth-alert a').first().getAttribute('href')
ok('that link points at /admin/login', href === '/admin/login', String(href))
await page.screenshot({ path: 'C:/Users/Admin/Desktop/kijiji-clone/.shots/12-staff-wrong-door.png' })

// And the link must actually work.
await page.locator('.auth-alert a').first().click()
await page.waitForURL(/admin\/login/, { timeout: 60000 })
ok('clicking it lands on the admin sign-in page', /admin\/login/.test(page.url()))

console.log('\n' + pass + '/' + (pass + fail) + ' checks passed')
await browser.close()
process.exit(fail ? 1 : 0)
