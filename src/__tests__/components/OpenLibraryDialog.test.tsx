import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OpenLibraryDialog } from "@/components/OpenLibraryDialog";
import { renderWithProviders } from "@/test-utils/testUtils";

jest.mock("@tauri-apps/plugin-dialog");

import * as dialogPlugin from "@tauri-apps/plugin-dialog";

describe("OpenLibraryDialog", () => {
  const mockOnClose = jest.fn();
  const mockOnLibrarySelected = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("renders dialog when open is true", () => {
    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    expect(screen.getByText("Open Calibre Library")).toBeInTheDocument();
    expect(
      screen.getByText(/Select the folder containing/),
    ).toBeInTheDocument();
  });

  it("does not render dialog when open is false", () => {
    renderWithProviders(
      <OpenLibraryDialog
        open={false}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    expect(screen.queryByText("Open Calibre Library")).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel button is clicked", async () => {
    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("opens file dialog when Browse button is clicked", async () => {
    (dialogPlugin.open as jest.Mock).mockResolvedValue("/test/library/path");

    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const browseButton = screen.getByRole("button", { name: /Browse/i });
    await userEvent.click(browseButton);

    await waitFor(() => {
      expect(dialogPlugin.open).toHaveBeenCalled();
    });
  });

  it("sets selected path when directory is selected", async () => {
    (dialogPlugin.open as jest.Mock).mockResolvedValue("/test/library/path");

    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const browseButton = screen.getByRole("button", { name: /Browse/i });
    await userEvent.click(browseButton);

    await waitFor(() => {
      const pathInput = screen.getByDisplayValue("/test/library/path");
      expect(pathInput).toBeInTheDocument();
    });
  });

  it("disables Open Library button when no path is selected", () => {
    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const openButton = screen.getByRole("button", { name: /Open Library/i });
    expect(openButton).toBeDisabled();
  });

  it("enables Open Library button when path is selected", async () => {
    (dialogPlugin.open as jest.Mock).mockResolvedValue("/test/library/path");

    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const browseButton = screen.getByRole("button", { name: /Browse/i });
    await userEvent.click(browseButton);

    await waitFor(() => {
      const openButton = screen.getByRole("button", { name: /Open Library/i });
      expect(openButton).not.toBeDisabled();
    });
  });

  it("calls onLibrarySelected with selected path", async () => {
    (dialogPlugin.open as jest.Mock).mockResolvedValue("/test/library/path");

    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const browseButton = screen.getByRole("button", { name: /Browse/i });
    await userEvent.click(browseButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("/test/library/path"),
      ).toBeInTheDocument();
    });

    const openButton = screen.getByRole("button", { name: /Open Library/i });
    await userEvent.click(openButton);

    await waitFor(() => {
      expect(mockOnLibrarySelected).toHaveBeenCalledWith("/test/library/path");
    });
  });

  it("displays error when file dialog fails", async () => {
    (dialogPlugin.open as jest.Mock).mockRejectedValue(
      new Error("Dialog failed"),
    );

    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const browseButton = screen.getByRole("button", { name: /Browse/i });
    await userEvent.click(browseButton);

    await waitFor(() => {
      expect(screen.getByText(/Dialog failed/)).toBeInTheDocument();
    });
  });

  it("displays error when onLibrarySelected fails", async () => {
    (dialogPlugin.open as jest.Mock).mockResolvedValue("/test/library/path");
    const mockOnLibrarySelectedError = jest
      .fn()
      .mockRejectedValue(new Error("Library open failed"));

    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelectedError}
      />,
    );

    const browseButton = screen.getByRole("button", { name: /Browse/i });
    await userEvent.click(browseButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("/test/library/path"),
      ).toBeInTheDocument();
    });

    const openButton = screen.getByRole("button", { name: /Open Library/i });
    await userEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByText(/Library open failed/)).toBeInTheDocument();
    });
  });

  it("shows error when no path is provided and Open Library is clicked", async () => {
    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const openButton = screen.getByRole("button", { name: /Open Library/i });
    expect(openButton).toBeDisabled();
  });

  it("clears selected path when dialog closes", async () => {
    (dialogPlugin.open as jest.Mock).mockResolvedValue("/test/library/path");

    const { rerender } = renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const browseButton = screen.getByRole("button", { name: /Browse/i });
    await userEvent.click(browseButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("/test/library/path"),
      ).toBeInTheDocument();
    });

    rerender(
      <OpenLibraryDialog
        open={false}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    rerender(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const pathInput = screen.queryByDisplayValue("/test/library/path");
    expect(pathInput).not.toBeInTheDocument();
  });

  it("sets loading state when isLoading is true", () => {
    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
        isLoading={true}
      />,
    );

    const openButton = screen.getByRole("button", { name: /Open Library/i });
    expect(openButton).toBeDisabled();
  });

  it("calls onClose after successful library selection", async () => {
    (dialogPlugin.open as jest.Mock).mockResolvedValue("/test/library/path");

    renderWithProviders(
      <OpenLibraryDialog
        open={true}
        onClose={mockOnClose}
        onLibrarySelected={mockOnLibrarySelected}
      />,
    );

    const browseButton = screen.getByRole("button", { name: /Browse/i });
    await userEvent.click(browseButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("/test/library/path"),
      ).toBeInTheDocument();
    });

    const openButton = screen.getByRole("button", { name: /Open Library/i });
    await userEvent.click(openButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
