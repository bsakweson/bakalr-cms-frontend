# E2E Test Suite

Comprehensive end-to-end integration tests for Bakalr CMS using Playwright.

## Overview

This test suite provides comprehensive coverage of the CMS UI and functionality, including:

- **Landing Page**: Branding, navigation, responsive design
- **Authentication**: Registration, login, logout, validation
- **Dashboard Navigation**: Sidebar, user menu, page routing
- **Content Management**: CRUD operations, filtering, search
- **Media Management**: Upload, metadata, deletion, bulk operations
- **Accessibility**: WCAG 2.0 AA compliance, keyboard navigation

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Suites

### 1. Landing Page Tests (`landing.spec.ts`)

Tests the public landing page functionality:

- Display correct branding (heading, description, CTAs)
- Verify meta tags and favicon presence
- Navigate to login page
- Navigate to register page
- Responsive mobile layout

**Coverage**: 5 test cases

### 2. Authentication Tests (`auth.spec.ts`)

Tests user authentication flows:

- User registration with unique email
- Login with existing credentials
- Validation errors for invalid credentials
- Email format validation
- Logout functionality

**Coverage**: 5 test cases  
**Test Credentials**: <admin@example.com> / admin123

### 3. Dashboard Navigation Tests (`dashboard.spec.ts`)

Tests dashboard layout and navigation:

- Display sidebar with navigation items
- Navigate to content page
- Navigate to users page
- Navigate to media page
- Open API docs in new tab
- Display user profile menu

**Coverage**: 6 test cases

### 4. Content Management Tests (`content.spec.ts`)

Tests content CRUD operations:

- Display content list
- Navigate to create content page
- Create new content entry
- Filter content by status
- Search content
- View content details
- Delete content entry

**Coverage**: 7 test cases

### 5. Media Management Tests (`media.spec.ts`)

Tests media upload and management:

- Display media library
- Upload a file
- Filter media by type
- Search media files
- View media details
- Update media metadata
- Delete media file
- Handle bulk selection

**Coverage**: 8 test cases

### 6. Accessibility Tests (`accessibility.spec.ts`)

Tests WCAG 2.0 AA compliance:

- Landing page accessibility
- Login page accessibility
- Register page accessibility
- Dashboard accessibility
- Proper heading hierarchy
- Form labels and ARIA attributes
- Keyboard accessibility
- Image alt text
- Link accessible names
- Color contrast
- Modal focus trap
- Skip navigation link

**Coverage**: 12 test cases

## Total Coverage

**38+ integration tests** across 6 test suites covering:
- Public pages (landing, auth)
- Protected pages (dashboard, content, media)
- Accessibility and WCAG compliance
- Cross-browser compatibility (Chrome, Firefox, Safari, Mobile)

## Browser Configuration

Tests run on multiple browsers by default:

- **Desktop Browsers**:
  - Chromium (Google Chrome)
  - Firefox
  - WebKit (Safari)

- **Mobile Browsers**:
  - Mobile Chrome (Pixel 5)
  - Mobile Safari (iPhone 12)

## CI/CD Integration

Tests are configured for continuous integration:

- **Retries**: 2 retries on CI, 0 on local
- **Workers**: 1 worker on CI, parallel on local
- **Reporters**: HTML report + GitHub Actions annotations
- **Artifacts**: Screenshots, videos, traces on failure

## Test Data Strategy

### Dynamic Test Data

Tests use timestamp-based unique identifiers:

```typescript
const uniqueEmail = `test-${Date.now()}@example.com`;
const uniqueTitle = `Test Content ${Date.now()}`;
```

### Test Credentials

Default admin account for authenticated tests:

- **Email**: <admin@example.com>
- **Password**: admin123

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
  });

  test('should do something', async ({ page }) => {
    // Test code
    await page.goto('/path');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Add timeouts** for async operations
3. **Handle missing data** gracefully (use test.skip())
4. **Clear state** between tests (beforeEach hooks)
5. **Use meaningful test names** (should + action + expected)

### Accessibility Testing

```typescript
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/path');
  
  const results = await new AxeBuilder({ page }).analyze();
  
  expect(results.violations).toEqual([]);
});
```

## Debugging

### Visual Debugging

```bash
# Run with browser visible
npm run test:e2e:headed

# Run in debug mode with inspector
npm run test:e2e:debug
```

### Trace Viewer

When tests fail, trace files are generated:

```bash
# Open trace viewer
npx playwright show-trace trace.zip
```

### Screenshots and Videos

On failure, tests automatically capture:
- Screenshot at failure point
- Video recording of entire test
- Trace file for step-by-step inspection

### Console Logs

View browser console logs:

```typescript
page.on('console', msg => console.log(msg.text()));
```

## Environment Configuration

Tests use environment variables:

```bash
# Base URL (default: http://localhost:3000)
PLAYWRIGHT_BASE_URL=http://localhost:3000

# API URL (for API tests)
PLAYWRIGHT_API_URL=http://localhost:8000
```

## Test Reports

HTML report is generated automatically:

```bash
npm run test:e2e:report
```

Report includes:
- Test results summary
- Failure screenshots
- Video recordings
- Trace files
- Execution timeline

## Troubleshooting

### Tests Failing Locally

1. **Ensure dev server is running**:
   ```bash
   npm run dev
   ```

2. **Check backend is running**:
   ```bash
   # Backend should be on port 8000
   curl http://localhost:8000/api/docs
   ```

3. **Clear browser cache**:
   ```bash
   rm -rf playwright/.cache
   ```

### Timeout Issues

Increase timeout in test:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Selector Issues

Use Playwright Inspector to find selectors:

```bash
npm run test:e2e:debug
```

## Performance

### Test Execution Time

- **Full suite**: ~2-3 minutes (parallel)
- **Single suite**: ~20-40 seconds
- **CI execution**: ~4-5 minutes (with retries)

### Optimization Tips

1. Run tests in parallel (default)
2. Use `test.describe.configure({ mode: 'parallel' })`
3. Skip unnecessary navigation with `page.goto()` caching
4. Use `test.step()` for better reporting

## Maintenance

### Updating Tests

When UI changes:
1. Update selectors in test files
2. Add data-testid attributes to components
3. Run tests to verify changes
4. Update screenshots if needed

### Adding New Tests

1. Create new `.spec.ts` file in `e2e/` directory
2. Import Playwright test utilities
3. Write test cases following existing patterns
4. Run tests locally to verify
5. Commit and push changes

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Support

For issues or questions:
- Open GitHub issue
- Check Playwright documentation
- Review test output and traces
- Contact development team
