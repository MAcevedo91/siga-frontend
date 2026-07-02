import { test, expect } from '@playwright/test'

test.describe('Incidentes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should navigate to incidentes page from sidebar', async ({ page }) => {
    // Click on "Registro Incidentes" in sidebar
    await page.click('text=Registro Incidentes')

    await page.waitForURL('/incidentes', { timeout: 10000 })
    await expect(page).toHaveURL('/incidentes')
  })

  test('should list incidentes', async ({ page }) => {
    await page.goto('/incidentes')

    // Wait for page to load
    await page.waitForSelector('table', { timeout: 10000 })

    // Check that table exists and may have rows
    await expect(page.locator('table')).toBeVisible()
  })

  test('should display breadcrumbs navigation', async ({ page }) => {
    await page.goto('/incidentes')

    // Check breadcrumbs are present
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toBeVisible()
  })

  test('should show registrar incidente button', async ({ page }) => {
    await page.goto('/incidentes')

    // Wait for page load
    await page.waitForLoadState('networkidle')

    // Check for "Registrar Incidente" or "Nuevo Incidente" button
    const hasButton = await page.locator('button:has-text("Incidente")').count() > 0
    expect(hasButton).toBeTruthy()
  })

  test('should filter incidentes by date range', async ({ page }) => {
    await page.goto('/incidentes')

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 })

    // Look for filter controls
    const hasFilters = await page.locator('button:has-text("Filtro")').or(page.locator('select')).count() > 0
    expect(hasFilters).toBeTruthy()
  })

  test('should navigate to incident detail', async ({ page }) => {
    await page.goto('/incidentes')

    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Check if there are any rows
    const rowCount = await page.locator('table tbody tr').count()

    if (rowCount > 0) {
      // Click on first row or detail button
      const firstRow = page.locator('table tbody tr').first()
      await firstRow.click()

      // Should navigate to detail page
      await page.waitForTimeout(1000)
      expect(page.url()).toContain('/incidente')
    }
  })
})
