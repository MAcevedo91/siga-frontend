import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/')

    // Check login form elements are visible
    await expect(page.locator('h1')).toContainText('SIGA Escolar')
    await expect(page.locator('h2')).toContainText('Iniciar sesión')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/')

    // Submit without filling the form
    await page.click('button[type="submit"]')

    // Wait for validation errors
    await expect(page.locator('text=El correo es obligatorio')).toBeVisible()
    await expect(page.locator('text=La contraseña es obligatoria')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/')

    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Wait for server error message
    await expect(page.locator('text=Credenciales incorrectas')).toBeVisible({ timeout: 5000 })
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/')

    // NOTE: Update these credentials with valid test user credentials
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })

    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })

    // Logout - click the logout button
    await page.click('[data-testid="logout-button"]')

    // Wait for redirect to login
    await page.waitForURL('/', { timeout: 5000 })
    await expect(page).toHaveURL('/')
    await expect(page.locator('h2')).toContainText('Iniciar sesión')
  })
})
