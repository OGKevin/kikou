import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComicOverviewPage from "@/pages/comic/overview";
import { useImageFiles } from "@/hooks/useImageFiles";
import { useNavigationContext } from "@/contexts/NavigationContext";

jest.mock("@/hooks/useImageFiles");
jest.mock("@/components/pages/comic/overview/info", () => () => (
  <div>InfoTabContent</div>
));
jest.mock("@/components/pages/comic/overview/pages", () => () => (
  <div>PagesTabContent</div>
));

// Custom NavigationContext for testing
interface NavigationContextType {
  setTabs: jest.Mock;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  setOnTabChange: jest.Mock;
}

const NavigationContext = React.createContext<
  NavigationContextType | undefined
>(undefined);

let setTabsMock: jest.Mock;
let setOnTabChangeMock: jest.Mock;

function NavigationContextTestProvider({
  children,
  initialTab = "info",
  setCurrentTabRef,
}: {
  children: React.ReactNode;
  initialTab?: string;
  setCurrentTabRef?: React.MutableRefObject<((tab: string) => void) | null>;
}) {
  const [currentTab, setCurrentTab] = React.useState(initialTab);
  if (setCurrentTabRef) setCurrentTabRef.current = setCurrentTab;
  setTabsMock = jest.fn();
  setOnTabChangeMock = jest.fn();
  return (
    <NavigationContext.Provider
      value={{
        setTabs: setTabsMock,
        currentTab,
        setCurrentTab,
        setOnTabChange: setOnTabChangeMock,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

jest.mock("@/contexts/NavigationContext", () => ({
  useNavigationContext: () => React.useContext(NavigationContext)!,
}));

describe("ComicOverviewPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useImageFiles as jest.Mock).mockReturnValue({
      imageFiles: ["img1.png", "img2.png"],
      loading: false,
      error: null,
    });
  });

  it("registers tabs correctly", () => {
    render(
      <NavigationContextTestProvider>
        <ComicOverviewPage />
      </NavigationContextTestProvider>,
    );
    expect(setTabsMock).toHaveBeenCalledWith([
      { label: "Info", value: "info" },
      { label: "Pages", value: "pages" },
    ]);
    expect(setOnTabChangeMock).toHaveBeenCalled();
  });

  it("shows InfoTab by default", () => {
    render(
      <NavigationContextTestProvider>
        <ComicOverviewPage />
      </NavigationContextTestProvider>,
    );
    expect(screen.getByText("InfoTabContent")).toBeInTheDocument();
    expect(screen.queryByText("PagesTabContent")).not.toBeInTheDocument();
  });

  it("shows PagesTab when selected", async () => {
    const setCurrentTabRef = {
      current: null as ((tab: string) => void) | null,
    };
    render(
      <NavigationContextTestProvider setCurrentTabRef={setCurrentTabRef}>
        <ComicOverviewPage />
      </NavigationContextTestProvider>,
    );
    // Update tab using ref and wait for UI update
    await act(async () => {
      if (setCurrentTabRef.current) setCurrentTabRef.current("pages");
    });
    expect(screen.getByText("PagesTabContent")).toBeInTheDocument();
    expect(screen.queryByText("InfoTabContent")).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    (useImageFiles as jest.Mock).mockReturnValue({
      imageFiles: [],
      loading: true,
      error: null,
    });
    render(
      <NavigationContextTestProvider>
        <ComicOverviewPage />
      </NavigationContextTestProvider>,
    );
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("shows error state", () => {
    (useImageFiles as jest.Mock).mockReturnValue({
      imageFiles: [],
      loading: false,
      error: "Test error",
    });
    render(
      <NavigationContextTestProvider>
        <ComicOverviewPage />
      </NavigationContextTestProvider>,
    );
    expect(screen.getByText(/Error: Test error/i)).toBeInTheDocument();
  });

  it("shows no images found state", () => {
    (useImageFiles as jest.Mock).mockReturnValue({
      imageFiles: [],
      loading: false,
      error: null,
    });
    render(
      <NavigationContextTestProvider>
        <ComicOverviewPage />
      </NavigationContextTestProvider>,
    );
    expect(screen.getByText(/No images found/i)).toBeInTheDocument();
  });
});
