import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import {
  NavigationProvider,
  useNavigationContext,
} from "@/contexts/NavigationContext";

function TestComponent() {
  const { showClearDialog, openClearDialog, closeClearDialog } =
    useNavigationContext();
  return (
    <div>
      <button onClick={openClearDialog}>Open</button>
      <button onClick={closeClearDialog}>Close</button>
      <span data-testid="dialog-state">
        {showClearDialog ? "open" : "closed"}
      </span>
    </div>
  );
}

describe("NavigationContext", () => {
  it("opens and closes the clear dialog", () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>,
    );
    expect(screen.getByTestId("dialog-state").textContent).toBe("closed");
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByTestId("dialog-state").textContent).toBe("open");
    fireEvent.click(screen.getByText("Close"));
    expect(screen.getByTestId("dialog-state").textContent).toBe("closed");
  });
});
