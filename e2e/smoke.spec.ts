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
  await expect(page.getByText('Your reputation')).toBeVisible({ timeout: 10_000 })
}

test('onboarding shows on first visit, offers business types, and completes', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Welcome to ReviewDot')).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('What kind of business do you run?')).toBeVisible()
  await page.getByRole('button', { name: /Hotel/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Enter workspace' }).click()
  await expect(page.getByText('Your reputation')).toBeVisible()
})

test('dashboard renders KPIs, health score, and AI suggestions', async ({ page }) => {
  await enterWorkspace(page)
  await expect(page.getByText('TOTAL REVIEWS', { exact: false })).toBeVisible()
  await expect(page.getByText('AI Business Health Score')).toBeVisible()
  await expect(page.getByText('AI Action Suggestions')).toBeVisible()
  await expect(page.getByText('Top Complaint Topics')).toBeVisible()
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

test('reviews filter, expand, draft AI reply, and take notes', async ({ page }) => {
  await enterWorkspace(page)
  await page.goto('/#/reviews')
  await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible()
  await page.getByRole('button', { name: 'Negative', exact: true }).click()
  // let the exit animations of filtered-out cards finish before targeting a card
  await page.waitForTimeout(800)
  const card = page.locator('article').filter({ hasText: 'negative' }).first()
  await card.locator('button').first().click()
  await expect(page.getByText('AI summary')).toBeVisible()
  await expect(page.getByText('Internal notes')).toBeVisible()
  await page.getByRole('button', { name: /Generate AI reply/ }).click()
  await expect(page.getByRole('button', { name: /Approve & publish/ })).toBeVisible({ timeout: 15_000 })
})

test('team page shows members, permissions, and activity', async ({ page }) => {
  await enterWorkspace(page)
  await page.goto('/#/team')
  await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible()
  await expect(page.getByText('Roles & permissions')).toBeVisible()
  await expect(page.getByText('Activity log')).toBeVisible()
})

test('analytics offers PDF, Excel, and CSV reports', async ({ page }) => {
  await enterWorkspace(page)
  await page.goto('/#/analytics')
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
  await expect(page.getByRole('button', { name: /PDF report/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Excel workbook/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /CSV data/ })).toBeVisible()
})

test('switching business type re-tunes the workspace', async ({ page }) => {
  await enterWorkspace(page)
  await page.goto('/#/settings')
  await page.getByRole('button', { name: /Clinic/ }).click()
  await page.goto('/#/')
  await expect(page.getByText('AI-scored for a clinic')).toBeVisible()
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
  await expect(page.getByText('Your reputation')).toBeVisible()
})
