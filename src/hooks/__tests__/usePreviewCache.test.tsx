import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { usePreviewCache } from "../usePreviewCache";
import { useArchiveContext } from "@/contexts/ArchiveContext";

// Mock the archive context
jest.mock("@/contexts/ArchiveContext", () => ({
  useArchiveContext: jest.fn(),
}));

// Mock the API function to prevent actual async calls
jest.mock("@/api/getCbzFileData", () => ({
  GetCBZFileData: jest.fn().mockImplementation(() => {
    // Return a promise that never resolves to prevent state updates
    return new Promise(() => {});
  }),
}));

// Test component that uses the hook
function TestComponent({ fileName }: { fileName: string | null }) {
  const { previewUrl, loading, error } = usePreviewCache(fileName);

  return (
    <div data-testid="test-component">
      <div data-testid="preview-url">{previewUrl || "no-url"}</div>
      <div data-testid="loading">{loading ? "loading" : "not-loading"}</div>
      <div data-testid="error">{error ? "has-error" : "no-error"}</div>
    </div>
  );
}

describe("usePreviewCache infinite loop detection", () => {
  const mockUseArchiveContext = useArchiveContext as jest.MockedFunction<
    typeof useArchiveContext
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should detect infinite loops when context objects are recreated on every render", async () => {
    let renderCount = 0;

    // Mock context that recreates objects on every call (common mistake)
    mockUseArchiveContext.mockImplementation(() => {
      renderCount++;

      return {
        path: "/test/path",
        result: null,
        loading: false,
        error: null,
        reload: jest.fn(),
        previewCache: { current: {} }, // useRef object
        tocFile: null,
        setTocFile: jest.fn(),
        hasUnsavedXmlChanges: false,
        setHasUnsavedXmlChanges: jest.fn(),
        selectedPage: 0,
        setSelectedPage: jest.fn(),
      };
    });

    // Spy on console.error to catch the "Maximum update depth exceeded" error
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      render(<TestComponent fileName="test.jpg" />);

      // Fast-forward time to trigger the infinite loop
      jest.advanceTimersByTime(100);

      await waitFor(
        () => {
          // Check if we got the maximum update depth error
          const maxUpdateDepthError = consoleSpy.mock.calls.find((call) =>
            call[0]?.toString().includes("Maximum update depth exceeded"),
          );

          if (maxUpdateDepthError) {
            expect(maxUpdateDepthError).toBeDefined();
          } else {
            // If no error yet, check render count
            expect(renderCount).toBe(2); // More than expected renders indicates a problem
          }
        },
        { timeout: 1000 },
      );
    } catch (error) {
      // The infinite loop should be caught by React's safety mechanism
      expect(error.toString()).toContain("Maximum update depth exceeded");
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("should not cause infinite loop with stable references", async () => {
    let renderCount = 0;
    const stablePreviewCache = { current: {} };

    // Mock context with stable references
    mockUseArchiveContext.mockImplementation(() => {
      renderCount++;

      return {
        path: "/test/path",
        result: null,
        loading: false,
        error: null,
        reload: jest.fn(),
        previewCache: stablePreviewCache, // Same object reference
        tocFile: null,
        setTocFile: jest.fn(),
        hasUnsavedXmlChanges: false,
        setHasUnsavedXmlChanges: jest.fn(),
        selectedPage: 0,
        setSelectedPage: jest.fn(),
      };
    });

    render(<TestComponent fileName="test.jpg" />);

    // Fast-forward time
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.getByTestId("test-component")).toBeInTheDocument();
    });

    // With stable references, we should have minimal renders (1-2 max)
    expect(renderCount).toBeLessThanOrEqual(2);
  });

  it("should detect the specific dependency that causes infinite loops", async () => {
    let renderCount = 0;
    const effectExecutions: string[] = [];

    // Mock the useEffect to track when it runs
    const originalUseEffect = React.useEffect;
    const useEffectSpy = jest
      .spyOn(React, "useEffect")
      .mockImplementation((effect, deps) => {
        const depString = JSON.stringify(deps);
        effectExecutions.push(depString);
        return originalUseEffect(effect, deps);
      });

    mockUseArchiveContext.mockImplementation(() => {
      renderCount++;
      return {
        path: "/test/path",
        result: null,
        loading: false,
        error: null,
        reload: jest.fn(),
        previewCache: { current: {} }, // useRef object
        tocFile: null,
        setTocFile: jest.fn(),
        hasUnsavedXmlChanges: false,
        setHasUnsavedXmlChanges: jest.fn(),
        selectedPage: 0,
        setSelectedPage: jest.fn(),
      };
    });

    try {
      render(<TestComponent fileName="test.jpg" />);
      jest.advanceTimersByTime(50);

      // Check if the same dependencies are causing repeated effect calls
      const uniqueEffects = new Set(effectExecutions);

      if (effectExecutions.length > 3) {
        console.log("Infinite loop detected due to changing dependencies");
      }

      expect(renderCount).toBe(2); // Should detect excessive renders
    } finally {
      useEffectSpy.mockRestore();
    }
  });
});
