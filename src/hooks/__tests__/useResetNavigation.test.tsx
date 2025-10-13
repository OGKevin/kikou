import { renderHook } from "@testing-library/react";
import { useResetNavigation } from "@/hooks/useResetNavigation";
import { NavigationProvider } from "@/contexts/NavigationContext";
import React from "react";

const mockSetTabs = jest.fn();
const mockSetButtons = jest.fn();

jest.mock("@/contexts/NavigationContext", () => ({
  useNavigationContext: () => ({
    setTabs: mockSetTabs,
    setButtons: mockSetButtons,
    tabs: [],
    buttons: [],
    currentTab: null,
    setCurrentTab: jest.fn(),
    onTabChange: null,
    setOnTabChange: jest.fn(),
    showClearDialog: false,
    openClearDialog: jest.fn(),
    closeClearDialog: jest.fn(),
  }),
  NavigationProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("useResetNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resets tabs and buttons on mount", () => {
    renderHook(() => useResetNavigation(), {
      wrapper: ({ children }) => (
        <NavigationProvider>{children}</NavigationProvider>
      ),
    });

    expect(mockSetTabs).toHaveBeenCalledWith([]);
    expect(mockSetButtons).toHaveBeenCalledWith([]);
  });

  it("calls setTabs and setButtons exactly once", () => {
    renderHook(() => useResetNavigation(), {
      wrapper: ({ children }) => (
        <NavigationProvider>{children}</NavigationProvider>
      ),
    });

    expect(mockSetTabs).toHaveBeenCalledTimes(1);
    expect(mockSetButtons).toHaveBeenCalledTimes(1);
  });
});
