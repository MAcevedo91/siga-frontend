# E2E Testing with Playwright

## Overview

This directory contains End-to-End (E2E) tests for the SIGA Escolar frontend application using Playwright. These tests verify critical user flows across three browsers: Chromium, Firefox, and WebKit (Safari).

## Prerequisites

Before running E2E tests, ensure you have:

1. **Node.js and npm** installed
2. **Playwright browsers** installed (run `npx playwright install` if not already done)
3. **Backend server running** - E2E tests require a live backend API
4. **Test database** with sample data

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install chromium firefox webkit
```

### 3. Start Backend Server

The E2E tests require both frontend and backend to be running:

```bash
# Terminal 1: Start backend (navigate to backend directory)
cd ../siga-backend  # adjust path as needed
npm run dev

# Terminal 2: Frontend will auto-start via Playwright config
# (configured in playwright.config.js)
```

### 4. Configure Test Credentials

**IMPORTANT:** Update test credentials in each spec file before running tests:

- File: `e2e/auth.spec.js`
- Update: `test@example.com` and `password123` with valid test user credentials

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

This runs all tests across all configured browsers (Chromium, Firefox, WebKit).

### Run Tests with UI Mode

```bash
npm run test:e2e:ui
```

Opens Playwright UI for interactive test debugging and execution.

### Run Specific Test File

```bash
npx playwright test e2e/auth.spec.js
```

### Run Tests in Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Debug Tests

```bash
npx playwright test --debug
```

### View Test Report

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

## Test Structure

### Test Files

- `auth.spec.js` - Authentication flows (login, logout, validation)
- `estudiantes.spec.js` - Student management (list, search, filter)
- `incidentes.spec.js` - Incident management (list, filter, navigation)

### Test Organization

Each test file follows this pattern:

```javascript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup (e.g., login)
  })

  test('should do something', async ({ page }) => {
    // Test implementation
  })
})
```

## Configuration

Configuration is in `playwright.config.js`:

- **Base URL:** `http://localhost:5173`
- **Test Directory:** `./e2e`
- **Timeout:** Default timeout for assertions and actions
- **Retries:** 2 retries in CI, 0 locally
- **Workers:** 1 in CI (serial), parallel locally
- **Auto Web Server:** Starts `npm run dev` automatically

## Writing New Tests

### Best Practices

1. **Use Semantic Selectors**: Prefer text content, roles, and accessible attributes
2. **Wait Properly**: Use `waitForURL`, `waitForSelector`, `waitForLoadState`
3. **Avoid Hard Timeouts**: Use Playwright's built-in waiting mechanisms
4. **Test User Flows**: Focus on critical paths users take
5. **Keep Tests Independent**: Each test should run independently
6. **Clean Test Data**: Use setup/teardown for data management

### Example Test

```javascript
test('should filter estudiantes', async ({ page }) => {
  await page.goto('/estudiantes')
  await page.waitForSelector('table tbody tr')

  const searchInput = page.locator('input[type="text"]').first()
  await searchInput.fill('Juan')

  await page.waitForTimeout(500) // Wait for debounce

  const rows = page.locator('table tbody tr')
  expect(await rows.count()).toBeGreaterThan(0)
})
```

## Troubleshooting

### Tests Failing Due to Timeout

- Ensure backend is running and accessible
- Check if frontend dev server started properly
- Increase timeout in specific tests: `{ timeout: 15000 }`

### Backend Connection Issues

- Verify backend is running on expected port
- Check CORS configuration allows frontend origin
- Verify `.env` configuration in both frontend and backend

### Test Data Issues

- Ensure test database has required seed data
- Use test-specific credentials that exist in database
- Reset test database between test runs if needed

### Browser Installation Issues

```bash
# Reinstall browsers
npx playwright install --force
```

## CI/CD Integration

For CI environments, the config automatically:

- Runs tests serially (1 worker)
- Retries failed tests twice
- Starts fresh web server
- Uses `forbidOnly` to prevent `.only()` tests

Example CI command:

```bash
CI=true npm run test:e2e
```

## Test Coverage

Current test coverage includes:

### Authentication (auth.spec.js)
- ✅ Display login page
- ✅ Form validation
- ✅ Invalid credentials error
- ✅ Successful login
- ✅ Logout

### Estudiantes (estudiantes.spec.js)
- ✅ Navigation from sidebar
- ✅ List students
- ✅ Display breadcrumbs
- ✅ Search/filter functionality
- ✅ Export buttons visibility

### Incidentes (incidentes.spec.js)
- ✅ Navigation from sidebar
- ✅ List incidents
- ✅ Display breadcrumbs
- ✅ Filter controls
- ✅ Navigation to detail view

## Future Enhancements

- [ ] Add tests for CRUD operations (create, edit, delete)
- [ ] Add tests for Protocolos RICE module
- [ ] Add tests for Analytics dashboard
- [ ] Add tests for user management
- [ ] Add visual regression testing
- [ ] Add performance testing
- [ ] Add accessibility testing
- [ ] Mock backend API for faster, isolated tests

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
