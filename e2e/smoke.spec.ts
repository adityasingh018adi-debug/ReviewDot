import { test, expect, type Page } from '@playwright/test'

async function fresh(page: Page, path = '/') {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto(path)
}

test.describe('marketing site', () => {
  test('server-renders the positioning and structured data', async ({ page }) => {
    const response = await page.goto('/')
    const html = (await response?.text()) ?? ''
    // crawlable without JavaScript: the copy must be in the server response,
    // not painted in afterwards
    expect(html).toContain('AI writes the review')
    expect(html).toContain('AI-powered customer feedback and review management')
    expect(html).toContain('"@type":"SoftwareApplication"')

    await expect(page.getByRole('heading', { name: /AI writes the review/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start Free' }).first()).toBeVisible()
  })

  test('explains the whole journey, from item name to posted review', async ({ page }) => {
    await page.goto('/')
    for (const step of [
      'Customer enters only the item name',
      'AI creates a complete review',
      'Customer reviews and can edit',
      'Choose a platform to post',
      'Review posted successfully',
    ]) {
      await expect(page.getByText(step, { exact: true })).toBeVisible()
    }
  })

  test('labels its sample testimonials as samples', async ({ page }) => {
    // These are written copy, not quotes from named customers. The page has to
    // say so — invented praise presented as genuine endorsement is regulated,
    // not merely impolite.
    await page.goto('/')
    await expect(page.getByText(/Sample testimonials/i)).toBeVisible()
  })

  test('runs the AI review writer demo', async ({ page }) => {
    // lives on /product since the home page was rebuilt
    await page.goto('/product')
    await page.getByRole('button', { name: /Create the review/ }).scrollIntoViewIfNeeded()
    await page.getByRole('button', { name: /Create the review/ }).click()
    await expect(page.locator('blockquote').first()).toBeVisible({ timeout: 15_000 })
    const draft = await page.locator('blockquote').first().innerText()
    expect(draft.length).toBeGreaterThan(20)
    // the draft may not invent claims the customer never made
    expect(draft).not.toMatch(/₹|\$\d|\b\d+ minutes?\b|\bstars?\b/i)
  })

  test('serves robots and sitemap', async ({ page }) => {
    const robots = await page.goto('/robots.txt')
    expect(robots?.status()).toBe(200)
    expect(await robots?.text()).toContain('Sitemap:')
    const sitemap = await page.goto('/sitemap.xml')
    expect(sitemap?.status()).toBe(200)
    expect(await sitemap?.text()).toContain('/pricing')
  })
})

test.describe('customer experience', () => {
  test.use({ viewport: { width: 400, height: 880 } })

  test('rate → feedback → AI draft → edit → choose destination', async ({ page }) => {
    await fresh(page, '/r/demo')
    await expect(page.getByRole('heading', { name: 'How was your experience?' })).toBeVisible()

    await page.getByRole('radio', { name: '5 stars' }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByRole('heading', { name: 'What did you enjoy?' })).toBeVisible()
    await page.getByRole('button', { name: 'Coffee', exact: true }).click()
    await page
      .getByPlaceholder('Tell us what you liked or what we could improve...')
      .fill('Coffee was really good and the sandwich was fresh. Staff was friendly.')
    await page.getByRole('button', { name: /Create My Review/ }).click()

    await expect(page.getByRole('heading', { name: 'Your review' })).toBeVisible()
    const useIt = page.getByRole('button', { name: /Use This Review/ })
    await expect(useIt).toBeVisible({ timeout: 15_000 })

    // the customer owns the text
    await page.getByRole('button', { name: /Edit review/ }).click()
    const editor = page.getByLabel('Edit your review')
    await expect(editor).toBeVisible()
    await editor.fill('My own words, edited.')
    await page.getByRole('button', { name: /Done editing/ }).click()
    await expect(page.getByText('My own words, edited.')).toBeVisible()

    await useIt.click()
    await expect(page.getByRole('heading', { name: /Where would you like to post it/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Post on Google/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Keep it private' })).toBeVisible()

    await page.getByRole('button', { name: 'Keep it private' }).click()
    await expect(page.getByRole('heading', { name: /Thank you/ })).toBeVisible()
  })

  test('asks a critical customer what to improve, and never blocks posting', async ({ page }) => {
    await fresh(page, '/r/demo')
    await page.getByRole('radio', { name: '2 stars' }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByRole('heading', { name: 'What could be better?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Waiting time' })).toBeVisible()

    await page.getByPlaceholder('Tell us what you liked or what we could improve...').fill('Service was slow.')
    await page.getByRole('button', { name: /Create My Review/ }).click()
    await expect(page.getByRole('button', { name: /Use This Review/ })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /Use This Review/ }).click()

    // a low rating still reaches every destination — nothing is suppressed
    await expect(page.getByRole('button', { name: /Post on Google/ })).toBeVisible()
  })

  test('an unknown code never reveals a business', async ({ page }) => {
    await page.goto('/r/definitely-not-a-real-code')
    await expect(page.getByRole('heading', { name: "This code isn't active" })).toBeVisible()
  })
})

test.describe('dashboard', () => {
  test('renders the headline metrics and product intelligence', async ({ page }) => {
    await fresh(page, '/app')
    // The seeded reference figures. If a change moves these, that is a bug in
    // the change — the demo window is built to reproduce them exactly.
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible()
    await expect(page.getByText('1,248').first()).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: 'Mango Cheesecake' }).first()
    await expect(row.getByText('86', { exact: true })).toBeVisible()
  })

  test('navigates the sidebar to QR campaigns and AI insights', async ({ page }) => {
    await fresh(page, '/app')
    await page.getByRole('link', { name: 'QR studio' }).click()
    await expect(page).toHaveURL(/\/app\/campaigns/)
    await expect(page.getByRole('heading', { name: 'QR studio' })).toBeVisible()

    await page.getByRole('link', { name: 'AI insights' }).click()
    await expect(page).toHaveURL(/\/app\/insights/)
    await expect(page.getByRole('heading', { name: 'AI Insights' })).toBeVisible()
  })

  test('opens product analytics', async ({ page }) => {
    await fresh(page, '/app')
    await page.getByRole('link', { name: /Mango Cheesecake/ }).first().click()
    await expect(page).toHaveURL(/products\/prd-mango-cheesecake/)
    // the seeded figures for this product, on the page every account now sees —
    // there is no demo-only product view left to diverge from it
    await expect(page.getByRole('heading', { name: 'Mango Cheesecake' })).toBeVisible()
    await expect(page.getByText('86').first()).toBeVisible()
    await expect(page.getByText('What customers said')).toBeVisible()
  })
})

test('the Anthropic SDK never reaches a client bundle', async ({ page }) => {
  await page.goto('/app/insights')
  const sources = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[src]')).map((script) => script.getAttribute('src') ?? ''),
  )
  expect(sources.length).toBeGreaterThan(0)
  for (const source of sources) {
    const body = await (await page.request.get(new URL(source, page.url()).toString())).text()
    expect(body).not.toContain('sk-ant')
    expect(body.toLowerCase()).not.toContain('anthropic')
  }
})

test('theme preference persists across reloads', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('unknown routes show the 404 page', async ({ page }) => {
  await page.goto('/nowhere')
  await expect(page.getByText('404')).toBeVisible()
})

test('an invitation link refuses rather than breaking when it means nothing', async ({ page }) => {
  // The page is public — the person being invited usually has no account yet —
  // so a token that resolves to nothing has to render a page, not an error. In
  // demo mode there is no database to resolve one against, which is the same
  // path a stale or withdrawn token takes.
  const response = await page.goto('/join/not-a-real-token')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /no longer valid/i })).toBeVisible()
})

test.describe('authentication', () => {
  test('the sign-in screen offers the real ways in', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByLabel('Work email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create an account' })).toBeVisible()
  })

  test('password reset screens are reachable and never 404', async ({ page }) => {
    const forgot = await page.goto('/forgot-password')
    expect(forgot?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible()

    const reset = await page.goto('/reset-password')
    expect(reset?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible()
  })

  test('the account menu shows who is signed in', async ({ page }) => {
    await page.goto('/app')
    await page.getByRole('button', { name: /Ritika/ }).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page.getByText('ritika@loveandlatte.in')).toBeVisible()
  })

  test('every internal link resolves — no dead navigation', async ({ page }) => {
    // Every link on every dashboard page, not just the sidebar. A dead link in
    // a card body is just as broken, and that is exactly where the two we had
    // were hiding.
    const pages = [
      '/app',
      '/app/inbox',
      '/app/feedback',
      '/app/outlets',
      '/app/campaigns',
      '/app/products',
      '/app/analytics',
      '/app/insights',
      '/app/customers',
      '/app/settings',
    ]
    const seen = new Set<string>()

    for (const path of pages) {
      const response = await page.goto(path)
      expect(response?.status(), `${path} should render`).toBe(200)

      const hrefs = await page
        .locator('a[href^="/"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))

      for (const href of hrefs) {
        if (!href || href.startsWith('//') || seen.has(href)) continue
        seen.add(href)
        const linked = await page.request.get(href)
        expect(linked.status(), `${href} (linked from ${path}) should not be a dead link`).toBe(200)
      }
    }

    expect(seen.size).toBeGreaterThan(10)
  })

  test('onboarding is skipped when there is no account to onboard', async ({ page }) => {
    // demo mode already has a workspace, so /onboarding sends you to the dashboard
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/app$/)
  })
})

test.describe('the recorded journey', () => {
  test.use({ viewport: { width: 400, height: 880 } })

  test('runs the whole flow without a single failed request or page error', async ({ page }) => {
    const pageErrors: string[] = []
    const failedRequests: string[] = []
    page.on('pageerror', (error) => pageErrors.push(String(error)))
    page.on('response', (response) => {
      // the scan path fires server actions at every step; a 4xx/5xx from one of
      // them is invisible to the customer and must not be invisible to us
      if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`)
    })

    await fresh(page, '/r/demo')
    await page.getByRole('radio', { name: '5 stars' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('textbox').fill('The flat white was excellent and the staff were lovely.')
    await page.getByRole('button', { name: /Create My Review/ }).click()
    await expect(page.getByRole('button', { name: /Use This Review/ })).toBeEnabled({ timeout: 20_000 })
    await page.getByRole('button', { name: /Use This Review/ }).click()

    await expect(page.getByRole('heading', { name: /Where would you like to post it/ })).toBeVisible()
    await page.getByRole('button', { name: 'Keep it private' }).click()
    await expect(page.getByRole('heading', { name: /Thank you/ })).toBeVisible()

    expect(pageErrors, 'page errors during the journey').toEqual([])
    expect(failedRequests, 'failed requests during the journey').toEqual([])
  })

  test('a rewrite does not restart the journey', async ({ page }) => {
    await fresh(page, '/r/demo')
    await page.getByRole('radio', { name: '4 stars' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('textbox').fill('Good coffee, the queue moved quickly.')
    await page.getByRole('button', { name: /Create My Review/ }).click()
    await expect(page.getByRole('button', { name: /Rewrite/ })).toBeEnabled({ timeout: 20_000 })

    const first = await page.locator('blockquote').first().innerText()
    await page.getByRole('button', { name: /Rewrite/ }).click()
    await expect(page.getByRole('button', { name: /Use This Review/ })).toBeEnabled({ timeout: 20_000 })

    // still on the draft step, with a draft in hand — the customer's own words
    // are always a valid fallback, so this must never come back empty
    const second = await page.locator('blockquote').first().innerText()
    expect(second.length).toBeGreaterThan(10)
    expect(first.length).toBeGreaterThan(10)
  })
})
