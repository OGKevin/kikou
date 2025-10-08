import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test-utils/testUtils";
import TooltipButton from "../TooltipButton";

describe("TooltipButton", () => {
  test("renders enabled button without tooltip", async () => {
    const handleClick = jest.fn();

    renderWithProviders(
      <TooltipButton onClick={handleClick}>Click me</TooltipButton>,
    );

    const btn = screen.getByRole("button", { name: /click me/i });

    await userEvent.click(btn);
    expect(handleClick).toHaveBeenCalled();
  });

  test("renders disabled button with tooltip", async () => {
    renderWithProviders(
      <TooltipButton disabled tooltip="Cannot click">
        Don&apos;t click
      </TooltipButton>,
    );

    const btn = screen.getByRole("button", { name: /don't click/i });

    expect(btn).toBeDisabled();

    // Hover the wrapper span to show tooltip since the disabled button has pointer-events: none
    const wrapper = btn.parentElement;

    await userEvent.hover(wrapper!);

    const tip = await screen.findByText(/cannot click/i);

    expect(tip).toBeInTheDocument();
  });
});
