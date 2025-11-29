# E2E Test Failures Summary

## Test Results Overview

**Run Date**: November 25, 2025  
**Total Tests**: 215  
**Status**:
- ✅ **7 passed**
- ❌ **3 failed**
- ⚠️ **7 interrupted**
- ⏭️ **198 did not run**

## Failed Tests (Accessibility Violations)

### 1. Landing Page - Heading Order Violation

**Test**: `accessibility.spec.ts:5:7 › landing page should not have accessibility violations`

**Issue**: Invalid heading hierarchy
- Page has H1 ("Bakalr CMS") then jumps directly to H3 ("Multi-Language", etc.)
- Should have H2 between H1 and H3

**Fix Required**:
```tsx
// In app/page.tsx or landing page component
// Change feature card headings from <h3> to <h2>

<h3 className="font-semibold">Multi-Language</h3>
// Should be:
<h2 className="font-semibold text-lg">Multi-Language</h2>
```

**File**: `frontend/app/page.tsx`

---

### 2. Login Page - Multiple Accessibility Violations

**Test**: `accessibility.spec.ts:13:7 › login page should not have accessibility violations`

**Issues**:
1. **Missing `<main>` landmark**: Document doesn't have a main element
2. **Missing H1 heading**: Page should have a level-one heading
3. **Content not in landmarks**: Form content not wrapped in semantic landmarks

**Fix Required**:
```tsx
// In app/(auth)/login/page.tsx

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
          {/* Rest of content */}
        </CardHeader>
        {/* ... */}
      </Card>
    </main>
  );
}
```

**File**: `frontend/app/(auth)/login/page.tsx`

---

### 3. Register Page - Multiple Accessibility Violations

**Test**: `accessibility.spec.ts:21:7 › register page should not have accessibility violations`

**Issues**: Same as login page
1. Missing `<main>` landmark
2. Missing H1 heading  
3. Content not in landmarks

**Fix Required**:
```tsx
// In app/(auth)/register/page.tsx

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          {/* Rest of content */}
        </CardHeader>
        {/* ... */}
      </Card>
    </main>
  );
}
```

**File**: `frontend/app/(auth)/register/page.tsx`

---

## Interrupted Tests (Form Input Issues)

### Issue: Cannot Find Email Input Field

**Affected Tests** (7 tests):
1. `auth.spec.ts:9:7 › should register a new user`
2. `auth.spec.ts:29:7 › should login with existing credentials`
3. `auth.spec.ts:46:7 › should show validation errors for invalid credentials`
4. `auth.spec.ts:58:7 › should validate email format`
5. `auth.spec.ts:72:7 › should logout successfully`
6. `accessibility.spec.ts:29:7 › dashboard should not have accessibility violations`
7. `accessibility.spec.ts:143:7 › modal dialogs should trap focus`

**Error**: `page.fill: Test ended. - waiting for locator('input[name="email"]')`

**Possible Causes**:
1. Input fields don't have `name` attribute
2. Test timeouts before page fully loads
3. Form component structure changed

**Investigation Needed**:

Check login/register form components:
```bash
# Check login form
grep -n 'name="email"' frontend/app/(auth)/login/page.tsx

# Check register form  
grep -n 'name="email"' frontend/app/(auth)/register/page.tsx
```

**Potential Fixes**:

**Option 1**: Ensure input fields have `name` attributes
```tsx
<Input
  id="email"
  name="email"  // ← Add this if missing
  type="email"
  {...register('email')}
/>
```

**Option 2**: Update test selectors to use `id` or `data-testid`
```typescript
// In test files, change from:
await page.fill('input[name="email"]', 'test@example.com');

// To:
await page.fill('input[id="email"]', 'test@example.com');
// Or:
await page.fill('[data-testid="email-input"]', 'test@example.com');
```

**Option 3**: Add explicit wait for form to load
```typescript
// In test files, before filling:
await page.waitForSelector('input[name="email"]', { state: 'visible' });
await page.fill('input[name="email"]', 'test@example.com');
```

---

## Action Plan

### High Priority (Accessibility)

1. ✅ **Fix Landing Page Heading Order**
   - File: `frontend/app/page.tsx`
   - Change: H3 → H2 for feature cards

2. ✅ **Fix Login Page Accessibility**
   - File: `frontend/app/(auth)/login/page.tsx`
   - Add: `<main>` wrapper
   - Change: Card title to `<h1>`

3. ✅ **Fix Register Page Accessibility**
   - File: `frontend/app/(auth)/register/page.tsx`
   - Add: `<main>` wrapper
   - Change: Card title to `<h1>`

### Medium Priority (Form Tests)

4. 🔍 **Investigate Form Input Selectors**
   - Check if input fields have `name` attributes
   - Verify forms render correctly
   - Add waits if needed

5. 🔄 **Update Test Selectors** (if needed)
   - Use more robust selectors
   - Add data-testid attributes for testing
   - Increase timeouts if pages load slowly

---

## Commands to Run

### Run Only Passing Tests (Exclude Accessibility)

```bash
cd frontend
npx playwright test --grep-invert "accessibility"
```

### Run Only Accessibility Tests

```bash
npx playwright test e2e/accessibility.spec.ts
```

### Run Only Auth Tests

```bash
npx playwright test e2e/auth.spec.ts
```

### Run Specific Failed Test

```bash
npx playwright test e2e/accessibility.spec.ts:5 --headed
```

### View Test Report

```bash
npm run test:e2e:report
```

The report is served at: <http://localhost:9323>

---

## Next Steps

1. **Fix accessibility issues first** (quick wins)
2. **Investigate form input issues** (requires code inspection)
3. **Re-run tests** to verify fixes
4. **Update test documentation** once all passing

---

## Test Files

- ✅ `landing.spec.ts` - Landing page tests (may pass after H2 fix)
- ⚠️ `auth.spec.ts` - Authentication tests (form input issues)
- ⚠️ `accessibility.spec.ts` - Accessibility tests (3 failures)
- ❓ `dashboard.spec.ts` - Not run yet
- ❓ `content.spec.ts` - Not run yet
- ❓ `media.spec.ts` - Not run yet

---

## Resources

- **Playwright Docs**: <https://playwright.dev/>
- **WCAG Guidelines**: <https://www.w3.org/WAI/WCAG21/quickref/>
- **Axe Rules**: <https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md>
- **Test Report**: <http://localhost:9323>
