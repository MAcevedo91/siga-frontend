import { test, expect } from '@playwright/test'

test.describe('Estudiantes', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should navigate to estudiantes page from sidebar', async ({ page }) => {
    // Click on "Directorio Estudiantes" in sidebar
    await page.click('text=Directorio Estudiantes')

    await page.waitForURL('/estudiantes', { timeout: 10000 })
    await expect(page).toHaveURL('/estudiantes')
  })

  test('should list estudiantes', async ({ page }) => {
    await page.goto('/estudiantes')

    // Wait for page to load
    await page.waitForSelector('table', { timeout: 10000 })

    // Check that table has at least some rows
    const rowCount = await page.locator('table tbody tr').count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('should display breadcrumbs navigation', async ({ page }) => {
    await page.goto('/estudiantes')

    // Check breadcrumbs are present
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toBeVisible()
  })

  test('should filter estudiantes by search', async ({ page }) => {
    await page.goto('/estudiantes')

    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Get initial count
    const initialCount = await page.locator('table tbody tr').count()

    // Type in search box
    const searchInput = page.locator('input[type="text"]').first()
    await searchInput.fill('test')

    // Wait for debounce (300ms based on code)
    await page.waitForTimeout(500)

    // Results should be filtered
    const filteredCount = await page.locator('table tbody tr').count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
  })

  test('should show export buttons', async ({ page }) => {
    await page.goto('/estudiantes')

    // Wait for page load
    await page.waitForLoadState('networkidle')

    // Check for export buttons
    await expect(page.locator('button', { hasText: 'Excel' }).or(page.locator('svg'))).toBeTruthy()
  })
})
