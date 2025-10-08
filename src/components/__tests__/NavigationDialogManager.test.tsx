import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import {
  NavigationProvider,
  useNavigationContext,
} from "@/contexts/NavigationContext";
import NavigationDialogManager from "@/components/ui/NavigationDialogManager";

function TriggerButton() {
  const { openClearDialog } = useNavigationContext();
  return <button onClick={openClearDialog}>Trigger</button>;
}

describe("NavigationDialogManager", () => {
  it("shows and hides the dialog when triggered", () => {
    render(
      <NavigationProvider>
        <NavigationDialogManager />
        <TriggerButton />
      </NavigationProvider>,
    );
    fireEvent.click(screen.getByText("Trigger"));
    expect(screen.getByTestId("clear-storage-overlay")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    expect(
      screen.queryByTestId("clear-storage-overlay"),
    ).not.toBeInTheDocument();
  });
});
