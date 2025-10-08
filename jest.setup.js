import "@testing-library/jest-dom/jest-globals";

// Mock Tauri API
const mockInvoke = jest.fn();

jest.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

// Mock Tauri app API
jest.mock("@tauri-apps/api/app", () => ({
  setTheme: jest.fn(),
}));

// Mock Tauri image API
jest.mock("@tauri-apps/api/image", () => ({}));

// Mock MUI Joy useColorScheme
jest.mock("@mui/joy", () => ({
  ...jest.requireActual("@mui/joy"),
  useColorScheme: () => ({
    mode: "light",
    setMode: jest.fn(),
    systemMode: "light",
    allColorSchemes: ["light", "dark"],
    lightColorScheme: "light",
    darkColorScheme: "dark",
    colorScheme: "light",
    setColorScheme: jest.fn(),
  }),
}));

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
}));

// Mock DOM methods
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  value: jest.fn(),
  writable: true,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, "createObjectURL", {
  value: jest.fn(() => "mocked-url"),
  writable: true,
});

// Make mockInvoke available globally for tests
global.mockInvoke = mockInvoke;

// Clean up mocks before each test
beforeEach(() => {
  mockInvoke.mockClear();
  localStorage.clear();

  // Reset DOM method mocks
  HTMLElement.prototype.scrollIntoView.mockClear &&
    HTMLElement.prototype.scrollIntoView.mockClear();
  URL.createObjectURL.mockClear && URL.createObjectURL.mockClear();

  // Reset console.error mock if it exists
  if (console.error.mockClear) {
    console.error.mockClear();
  }
});
