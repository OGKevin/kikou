---
applyTo: "**/*.test.tsx,**/*.test.ts"
---

# Frontend Tests

## React act() Warnings

**CRITICAL: All React `act()` warnings MUST be addressed before committing code.**

When testing React components, any code that causes state updates must be wrapped in `act()` to ensure tests accurately reflect how the component behaves in the browser.

### Common Scenarios Requiring act()

1. **Timer Advances (jest.advanceTimersByTime, jest.runAllTimers, etc.)**

   ```typescript
   import { act } from "@testing-library/react";

   act(() => {
     jest.advanceTimersByTime(1000);
   });
   ```

2. **Manual State Updates in Tests**

   ```typescript
   act(() => {
     // Code that triggers state updates
     someFunction();
   });
   ```

3. **Cleanup with Pending Timers**
   ```typescript
   afterEach(() => {
     act(() => {
       jest.runOnlyPendingTimers();
     });
     jest.useRealTimers();
   });
   ```

### Why This Matters

- Ensures tests accurately simulate browser behavior
- Prevents flaky tests and race conditions
- Makes test assertions reliable and deterministic
- React requires this for proper testing of concurrent features

**If you see "An update to [Component] inside a test was not wrapped in act(...)" warnings:**

1. Identify what's causing the state update (timers, async operations, etc.)
2. Wrap that code in `act()`
3. Re-run tests to verify warnings are gone

## Test ID Selection

- Prefer using `getByTestId` (or `queryByTestId`, `findByTestId`, etc.) over `getByText` for selecting elements in frontend tests. This ensures selectors are robust against UI text changes and localization.
- Only use `getByText` when there is no reasonable alternative (e.g. for verifying visible text content).
- Always add a `data-testid` attribute to important elements/components that need to be targeted in tests.

## Content Assertions

- When asserting text content within an element retrieved via `getByTestId`, check the element's content against **test data variables** rather than hardcoded strings.
- Use test data (like `mockBook.title`) to verify that rendered content matches the expected data.

**Good:**

```typescript
const element = screen.getByTestId("book-title");
expect(element).toHaveTextContent(mockBook.title);
```

**Avoid:**

```typescript
const element = screen.getByTestId("book-title");
expect(element).toHaveTextContent("Test Book");
```

**Also Good (when text is meant to be static UI):**

```typescript
expect(screen.getByTestId("error-message")).toBeInTheDocument();
```

## Guidelines

- Define test data (mocks, fixtures) as constants at the top of test files
- Reference these constants in assertions instead of hardcoding strings
- This makes tests maintainable: when test data changes, assertions automatically reflect those changes
- Reduces test brittleness and improves clarity about what is being tested
