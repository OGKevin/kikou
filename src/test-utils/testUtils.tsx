// Mock Joy UI hooks before importing components
jest.mock("@mui/joy", () => ({
  ...jest.requireActual("@mui/joy"),
  useColorScheme: () => ({
    setMode: jest.fn(),
    mode: "light",
  }),
}));

// Provide a global matchMedia polyfill for jsdom so MUI's CssVarsProvider can use it
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  };
}

import React from "react";
import { render } from "@testing-library/react";
import { CssVarsProvider } from "@mui/joy";
import { ThemeProvider } from "../contexts/ThemeContext";

// Mock Tauri APIs
jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn(),
}));

jest.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: jest.fn(() => ({
    theme: jest.fn(() => Promise.resolve("system")),
  })),
}));

jest.mock("@tauri-apps/api/app", () => ({
  setTheme: jest.fn(),
}));

// Test utility to render components with all required providers
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <CssVarsProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </CssVarsProvider>,
  );
}

// Mock factory for useXmlValidation hook
export function createMockXmlValidation(overrides = {}) {
  return {
    isValid: null,
    isValidating: false,
    validationMessage: null,
    validateXml: jest.fn(),
    clearValidation: jest.fn(),
    ...overrides,
  };
}

// Mock factory for useArchiveValidation hook
export function createMockArchiveValidation(overrides = {}) {
  return {
    isValidArchive: true,
    isLoading: false,
    error: null,
    ...overrides,
  };
}

// Set up common mocks for ComicEditXmlPage tests
export function setupComicEditXmlPageMocks() {
  // Mock window.matchMedia for Joy UI
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    };

  // Mock next/router
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  jest.spyOn(require("next/router"), "useRouter").mockReturnValue({
    query: { path: "test.cbz" },
    push: jest.fn(),
  });
}
