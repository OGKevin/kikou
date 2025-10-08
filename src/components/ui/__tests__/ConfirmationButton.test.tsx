import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test-utils/testUtils";
import ConfirmationButton from "../ConfirmationButton";

describe("ConfirmationButton", () => {
  test("shows confirmation overlay and calls onConfirm", async () => {
    const handleConfirm = jest.fn(async () => Promise.resolve());

    renderWithProviders(
      <ConfirmationButton onConfirm={handleConfirm}>Delete</ConfirmationButton>,
    );

    const btn = screen.getByRole("button", { name: /delete/i });

    await userEvent.click(btn);

    const overlay = screen.getByTestId("confirmation-overlay");

    expect(overlay).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /yes/i });

    await userEvent.click(confirmBtn);

    await waitFor(() => expect(handleConfirm).toHaveBeenCalled());
  });

  test("cancel closes overlay without calling onConfirm", async () => {
    const handleConfirm = jest.fn();

    renderWithProviders(
      <ConfirmationButton onConfirm={handleConfirm}>Reset</ConfirmationButton>,
    );

    const btn = screen.getByRole("button", { name: /reset/i });

    await userEvent.click(btn);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });

    await userEvent.click(cancelBtn);

    expect(handleConfirm).not.toHaveBeenCalled();
  });
});
