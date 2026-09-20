import { test, expect, type Page } from '@playwright/test'

/** Clears anything a previous test persisted in this browser profile. */
async function freshApp(page: Page, path = '/') {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('reviewdot'))
  await page.goto(`/#${path}`)
}

test.describe('landing page', () => {
  test('presents the positioning, hero stats and the four steps', async ({ page }) => {
    await freshApp(page)
    await expect(page.getByRole('heading', { name: 'Every Scan Can Become a Review.' })).toBeVisible()
    await expect(page.getByText('Customer Experience & Review Intelligence', { exact: true })).toBeVisible()
    await expect(page.getByText('10K+', { exact: true })).toBeVisible()
    await expect(page.getByText('1M+', { exact: true })).toBeVisible()
    await expect(page.getByText('4.8 ★', { exact: true })).toBeVisible()

    await expect(page.getByRole('heading', { name: 'A simple process. A big impact.' })).toBeVisible()
    for (const step of ['Scan', 'Rate & Feedback', 'Review', 'Grow']) {
      await expect(page.getByRole('heading', { name: step, exact: true })).toBeVisible()
    }
  })

  test('shows a scannable QR table card with the brand message', async ({ page }) => {
    await freshApp(page)
    const card = page.getByRole('img', { name: /QR code for/ }).first()
    await expect(card).toBeVisible()
    await expect(page.getByText('Loved your experience?').first()).toBeVisible()
    await expect(page.getByText('Scan to review').first()).toBeVisible()
    await expect(page.getByText('Your feedback helps us grow ❤️').first()).toBeVisible()
  })

  test('navigates to pricing and compares plans', async ({ page }) => {
    await freshApp(page)
    await page.getByRole('link', { name: 'Pricing', exact: true }).first().click()
    await expect(page).toHaveURL(/#\/pricing/)
    await expect(page.getByRole('heading', { name: 'Priced per outlet, not per review.' })).toBeVisible()
    await expect(page.getByText('Most popular')).toBeVisible()
    await page.getByRole('switch', { name: 'Toggle yearly billing' }).click()
    await expect(page.getByText(/billed yearly/).first()).toBeVisible()
  })
})

test.describe('customer scan experience', () => {
  test('happy path invites a public review without forcing it', async ({ page }) => {
    await freshApp(page, '/r/demo')
    await expect(page.getByRole('heading', { name: /How was your/ })).toBeVisible()

    await page.getByRole('radio', { name: '5 stars' }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByRole('heading', { name: 'What did you love?' })).toBeVisible()
    await page.getByRole('button', { name: 'Taste' }).click()
    await page.getByPlaceholder('Tell us more...').fill('The mango flavour was incredible.')
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByRole('heading', { name: 'Thank you! ❤️' })).toBeVisible()
    await expect(page.getByText("We're glad you loved it!")).toBeVisible()
    await expect(page.getByRole('button', { name: /Review on Google/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Share on Instagram/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible()
    await expect(page.getByText(/never post on your behalf/)).toBeVisible()

    await page.getByRole('button', { name: 'Maybe later' }).click()
    await expect(page.getByRole('heading', { name: 'Thanks for sharing!' })).toBeVisible()
  })

  test('low ratings route to private feedback and still allow a public review', async ({ page }) => {
    await freshApp(page, '/r/demo')
    await page.getByRole('radio', { name: '2 stars' }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByRole('heading', { name: "We're sorry to hear that." })).toBeVisible()
    await expect(page.getByText(/You can still leave a public review/)).toBeVisible()
    await page.getByRole('button', { name: 'Long Wait' }).click()
    await page.getByPlaceholder('Tell us what went wrong...').fill('We waited 25 minutes.')
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page.getByRole('heading', { name: /feedback has been sent/ })).toBeVisible()
  })

  test('feedback submitted by a customer reaches the dashboard', async ({ page }) => {
    await freshApp(page, '/r/demo')
    await page.getByRole('radio', { name: '1 star' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByPlaceholder('Tell us what went wrong...').fill('E2E generated feedback entry.')
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByRole('heading', { name: /feedback has been sent/ })).toBeVisible()

    await page.goto('/#/app/feedback')
    await expect(page.getByText('E2E generated feedback entry.')).toBeVisible()
  })
})

test.describe('dashboard', () => {
  test('shows the headline metrics and product intelligence', async ({ page }) => {
    await freshApp(page, '/app')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    await expect(page.getByText('QR Scans').first()).toBeVisible()
    await expect(page.getByText('1,248').first()).toBeVisible()
    await expect(page.getByText('326', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('4.7 ★').first()).toBeVisible()
    await expect(page.getByText('26.1%').first()).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: 'Mango Cheesecake' }).first()
    await expect(row.getByText('86', { exact: true })).toBeVisible()
    await expect(row.getByText('4.9', { exact: true })).toBeVisible()
    await expect(row.getByText('91%', { exact: true })).toBeVisible()
  })

  test('opens product analytics with an AI summary', async ({ page }) => {
    await freshApp(page, '/app')
    await page.getByRole('link', { name: /Mango Cheesecake/ }).first().click()
    await expect(page).toHaveURL(/products\/prd-mango-cheesecake/)
    await expect(page.getByRole('heading', { name: /Mango Cheesecake/ })).toBeVisible()
    await expect(page.getByText('AI customer summary')).toBeVisible()
    await expect(page.getByText('Customers frequently mention')).toBeVisible()
    await expect(page.getByText('Areas mentioned for improvement')).toBeVisible()
    await expect(page.getByText('Outlet performance')).toBeVisible()
  })

  test('filters reviews and switches feedback status', async ({ page }) => {
    await freshApp(page, '/app/reviews')
    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible()
    await page.getByLabel('Filter by rating').selectOption('4')
    await page.waitForTimeout(300)
    await expect(page.getByText(/matching/)).toBeVisible()

    await page.goto('/#/app/feedback')
    await expect(page.getByRole('heading', { name: 'Feedback' })).toBeVisible()
    // taking a piece of feedback on moves it out of "new" and into the pipeline
    const takeOn = page.getByRole('button', { name: 'Take it on' })
    const before = await takeOn.count()
    expect(before).toBeGreaterThan(0)
    await takeOn.first().click()
    await expect(takeOn).toHaveCount(before - 1)
    await expect(page.getByRole('button', { name: 'Mark resolved' }).first()).toBeVisible()
  })

  test('renders analytics charts and the AI insights page', async ({ page }) => {
    await freshApp(page, '/app/analytics')
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
    await expect(page.getByText('Reviews and scans over time')).toBeVisible()
    await expect(page.getByText('Rating distribution').first()).toBeVisible()
    await expect(page.getByText('Feedback volume')).toBeVisible()

    await page.goto('/#/app/insights')
    await expect(page.getByRole('heading', { name: 'AI Insights' })).toBeVisible()
    await expect(page.getByText('What changed this period')).toBeVisible()
    await page.getByRole('button', { name: 'What is hurting our rating?' }).click()
    await expect(page.getByText(/most reported issue|weakest performer/).first()).toBeVisible()
  })
})

test.describe('QR studio', () => {
  test('creates a dynamic QR code and exposes its actions', async ({ page }) => {
    await freshApp(page, '/app/qr')
    await expect(page.getByRole('heading', { name: 'QR Codes' })).toBeVisible()

    await page.getByRole('button', { name: /Create QR/ }).click()
    await expect(page.getByRole('dialog', { name: 'Create a QR code' })).toBeVisible()
    await page.getByLabel('Location', { exact: true }).fill('Table 42')
    await page.getByRole('button', { name: 'Generate QR' }).click()
    await expect(page.getByRole('dialog', { name: 'Create a QR code' })).toBeHidden()

    const detail = page.getByRole('dialog')
    await expect(detail.getByText(/Table 42/).first()).toBeVisible()
    await expect(detail.getByRole('button', { name: /Download PNG/ })).toBeVisible()
    await expect(detail.getByRole('button', { name: /Print \/ PDF/ })).toBeVisible()
    await expect(detail.getByRole('button', { name: /Copy link/ })).toBeVisible()
    await expect(detail.getByText(/reviewdot\.in\/r\//).first()).toBeVisible()
  })

  test('pausing a code stops it collecting feedback', async ({ page }) => {
    await freshApp(page, '/app/qr')
    await page.getByRole('button', { name: /Create QR/ }).click()
    await page.getByLabel('Location', { exact: true }).fill('Table 77')
    await page.getByRole('button', { name: 'Generate QR' }).click()
    await expect(page.getByRole('dialog', { name: 'Create a QR code' })).toBeHidden()

    const detail = page.getByRole('dialog')
    const link = await detail.getByText(/reviewdot\.in\/r\//).first().textContent()
    const code = link?.split('/r/')[1]?.trim()
    await detail.getByRole('button', { name: 'paused' }).click()
    await page.keyboard.press('Escape')

    await page.goto(`/#/r/${code}`)
    await expect(page.getByRole('heading', { name: 'This code is paused' })).toBeVisible()
  })
})

test('theme preference persists across reloads', async ({ page }) => {
  await freshApp(page, '/app')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('unknown routes show the 404 page', async ({ page }) => {
  await freshApp(page, '/nowhere')
  await expect(page.getByText('404')).toBeVisible()
  await page.getByRole('link', { name: 'Back to home' }).click()
  await expect(page.getByRole('heading', { name: 'Every Scan Can Become a Review.' })).toBeVisible()
})
