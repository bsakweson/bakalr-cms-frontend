# Frontend E2E Testing Guide

## Setup Status ✅

Your Playwright E2E testing environment is now set up with:

- **Playwright Version**: 1.57.0
- **Test Framework**: Playwright Test
- **Browsers**: Chromium, Firefox, WebKit
- **Frontend Server**: Running on <http://localhost:3000>
- **Backend Server**: Running on <http://localhost:8000>

## Available Test Commands

### 1. Run Tests in UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

This opens the **Playwright UI** where you can:
- See all test files and cases
- Run individual tests or suites
- Watch tests execute in real-time
- Debug with time travel
- View screenshots and traces
- Re-run failed tests

### 2. Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

Runs tests with visible browser windows.

### 3. Run All Tests (Headless)

```bash
npm run test:e2e
```

Runs all tests headlessly across all configured browsers.

### 4. Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### 5. Run Specific Test File

```bash
npx playwright test e2e/landing.spec.ts --ui
npx playwright test e2e/auth.spec.ts --ui
npx playwright test e2e/dashboard.spec.ts --ui
```

### 6. View Test Report

```bash
npm run test:e2e:report
```

Opens the HTML report from the last test run.

## Test Suites

### Current Test Files

1. **landing.spec.ts** - Landing page tests (5 tests)
2. **auth.spec.ts** - Authentication flow tests (5 tests)
3. **dashboard.spec.ts** - Dashboard navigation tests (6 tests)
4. **content.spec.ts** - Content management tests (7 tests)
5. **media.spec.ts** - Media management tests (5+ tests)
6. **accessibility.spec.ts** - Accessibility compliance tests

## Quick Start Workflow

### For Interactive Testing (Recommended)

```bash
# 1. Make sure servers are running
cd /Users/bsakweson/dev/bakalr-cms
# Backend: poetry run uvicorn backend.main:app --reload
# Frontend: cd frontend && npm run dev

# 2. Open Playwright UI
cd frontend
npm run test:e2e:ui
```

### In the Playwright UI

1. **Left sidebar**: Shows all test files
2. **Middle panel**: Shows test cases when you select a file
3. **Right panel**: Shows test execution with:
   - Browser viewport
   - Actions/assertions log
   - Screenshots
   - Console logs

### Tips for UI Mode

- ✅ **Pick & Locate**: Click the crosshair icon to select elements on the page
- ✅ **Watch Mode**: Tests automatically re-run when files change
- ✅ **Time Travel**: Hover over actions to see the exact state at that moment
- ✅ **Filters**: Filter by passed, failed, or skipped tests
- ✅ **Projects**: Run tests across different browsers (chromium, firefox, webkit)

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    // Navigate
    await page.goto('/some-path');
    
    // Interact
    await page.getByRole('button', { name: 'Click Me' }).click();
    
    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Common Patterns

```typescript
// Navigation
await page.goto('/');
await expect(page).toHaveURL('/expected-path');

// Finding elements
page.getByRole('button', { name: 'Submit' })
page.getByText('Welcome')
page.getByLabel('Email')
page.getByPlaceholder('Enter email')
page.locator('.custom-class')

// Interactions
await button.click();
await input.fill('value');
await select.selectOption('option');
await checkbox.check();

// Assertions
await expect(element).toBeVisible();
await expect(element).toHaveText('Expected');
await expect(element).toHaveAttribute('href', '/link');
await expect(page).toHaveTitle(/Page Title/);
```

## Configuration

The Playwright config is in `playwright.config.ts`:

```typescript
- testDir: './e2e'
- baseURL: 'http://localhost:3000'
- retries: 2 (on CI)
- workers: Parallel execution
- browsers: chromium, firefox, webkit, mobile variants
- webServer: Auto-starts dev server if not running
```

## CI/CD Integration

Tests are configured for CI with:
- Automatic retries (2 attempts)
- Serial execution on CI
- HTML reporter
- Screenshots on failure
- Video recording on failure
- Trace collection on retry

## Troubleshooting

### Tests Fail to Start

```bash
# Ensure servers are running
lsof -ti:3000  # Frontend should return a PID
lsof -ti:8000  # Backend should return a PID

# Reinstall browsers
npx playwright install
```

### Flaky Tests

- Use `test.setTimeout(30000)` to increase timeout
- Add explicit waits: `await page.waitForSelector()`
- Use `await expect().toBeVisible()` instead of `toBeTruthy()`

### Debug Failures

```bash
# Run with debug flag
npm run test:e2e:debug

# Or view traces from failed tests
npx playwright show-trace trace.zip
```

## Best Practices

1. ✅ **Use semantic locators**: `getByRole`, `getByLabel`, `getByText`
2. ✅ **Avoid hard-coded waits**: Use `waitFor` methods
3. ✅ **Test user flows**: Not just individual actions
4. ✅ **Keep tests independent**: Each test should be self-contained
5. ✅ **Use descriptive test names**: `should display error when password is invalid`
6. ✅ **Group related tests**: Use `test.describe()` blocks
7. ✅ **Clean up test data**: Reset state between tests

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Debugging](https://playwright.dev/docs/debug)

## Next Steps

1. Run `npm run test:e2e:ui` to explore the test suite
2. Review existing test files in the `e2e/` directory
3. Add new test cases for features you're building
4. Run tests before committing code
5. Check test reports after CI runs

Happy Testing! 🎭
