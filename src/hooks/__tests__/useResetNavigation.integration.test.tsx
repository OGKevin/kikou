import { render, screen } from "@testing-library/react";
import { useResetNavigation } from "@/hooks/useResetNavigation";
import {
  NavigationProvider,
  useNavigationContext,
} from "@/contexts/NavigationContext";
import React from "react";

function TestComponent() {
  useResetNavigation();
  const { tabs, buttons } = useNavigationContext();

  return (
    <div>
      <div data-testid="tabs-count">{tabs.length}</div>
      <div data-testid="buttons-count">{buttons.length}</div>
      {tabs.length === 0 && <div data-testid="no-tabs">No tabs</div>}
      {buttons.length === 0 && <div data-testid="no-buttons">No buttons</div>}
    </div>
  );
}

describe("useResetNavigation integration", () => {
  it("renders component with no tabs or buttons after reset", () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>,
    );

    expect(screen.getByTestId("tabs-count")).toHaveTextContent("0");
    expect(screen.getByTestId("buttons-count")).toHaveTextContent("0");
    expect(screen.getByTestId("no-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("no-buttons")).toBeInTheDocument();
  });

  it("ensures navigation context is properly reset", () => {
    const { container } = render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>,
    );

    const tabsCount = container.querySelector('[data-testid="tabs-count"]');
    const buttonsCount = container.querySelector(
      '[data-testid="buttons-count"]',
    );

    expect(tabsCount?.textContent).toBe("0");
    expect(buttonsCount?.textContent).toBe("0");
  });
});
