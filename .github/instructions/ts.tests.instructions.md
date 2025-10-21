---
applyTo:
  - "**/*.test.tsx"
  - "**/*.test.ts"
  - "**/*.spec.tsx"
  - "**/*.spec.ts"
  - "**/__tests__/**/*.tsx"
  - "**/__tests__/**/*.ts"
---

# Frontend Tests

- Prefer using `getByTestId` (or `queryByTestId`, etc.) over `getByText` for selecting elements in frontend tests. This ensures selectors are robust against UI text changes and localization.
- Only use `getByText` when there is no reasonable alternative (e.g. for verifying visible text content).
- Always add a `data-testid` attribute to important elements/components that need to be targeted in tests.
