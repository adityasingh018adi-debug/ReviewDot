import { test, expect, type Page } from '@playwright/test'

async function enterWorkspace(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem(
      'reviewdot-workspace',
      JSON.stringify({ state: { onboardingDone: true }, version: 0 }),
    )
  })
  await page.reload()
  await expect(page.getByText('Good evening')).toBeVisible({ timeout: 10_000 })
}

test('onboarding shows on first visit and can be completed', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Welcome to ReviewDot')).toBeVisible()
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await expect(page.getByText('Good evening')).toBeVisible()
})

test('dashboard renders KPIs and widgets', async ({ page }) => {
  await enterWorkspace(page)
  await expect(page.getByText('TOTAL REVIEWS', { exact: false })).toBeVisible()
  await expect(page.getByText('Review & Response Volume')).toBeVisible()
  await expect(page.getByText('AI Insights')).toBeVisible()
})

test('command palette opens and navigates', async ({ page }) => {
  await enterWorkspace(page)
  await page.keyboard.press('Control+k')
  const paletteInput = page.getByPlaceholder('Type a command or search…')
  await expect(paletteInput).toBeVisible()
  await paletteInput.fill('go to reviews')
  await paletteInput.press('Enter')
  await expect(page).toHaveURL(/#\/reviews/)
  await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible()
})

test('reviews filter instantly and expand with AI reply', async ({ page }) => {
  await enterWorkspace(page)
  await page.goto('/#/reviews')
  await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible()
  await page.getByRole('button', { name: 'Negative', exact: true }).click()
  // let the exit animations of filtered-out cards finish before targeting a card
  await page.waitForTimeout(800)
  const card = page.locator('article').filter({ hasText: 'negative' }).first()
  await card.locator('button').first().click()
  await expect(page.getByText('AI summary')).toBeVisible()
  await page.getByRole('button', { name: /Generate AI reply/ }).click()
  await expect(page.getByRole('button', { name: /Approve & publish/ })).toBeVisible({ timeout: 15_000 })
})

test('theme toggles to light and persists', async ({ page }) => {
  await enterWorkspace(page)
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('unknown route shows 404 page', async ({ page }) => {
  await enterWorkspace(page)
  await page.goto('/#/nowhere')
  await expect(page.getByText('404')).toBeVisible()
  await page.getByRole('link', { name: /Back to dashboard/ }).click()
  await expect(page.getByText('Good evening')).toBeVisible()
})
