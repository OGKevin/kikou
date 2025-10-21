import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResizablePageSettingsPanel from "../ResizablePageSettingsPanel";
import { PageType, createBlankPageInfo } from "@/types/comic";

jest.mock("@/components/pages/SettingsPanel", () => {
  return function MockPageSettingsPanel({
    targetFile,
    currentSettings,
    onUpdateSettings,
    onReset,
  }: any) {
    return (
      <div data-testid="page-settings-panel">
        <div>Target: {targetFile || "none"}</div>
        <div>Type: {currentSettings.Type}</div>
        <button
          onClick={() => onUpdateSettings({ Type: PageType.FrontCover })}
          data-testid="update-button"
        >
          Update Settings
        </button>
        <button onClick={onReset} data-testid="reset-button">
          Reset
        </button>
      </div>
    );
  };
});

jest.mock("react-resizable-panels", () => ({
  Panel: ({ children, defaultSize, minSize, maxSize }: any) => (
    <div
      data-testid="panel"
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
    >
      {children}
    </div>
  ),
}));

describe("ResizablePageSettingsPanel", () => {
  const mockOnUpdateSettings = jest.fn();
  const mockOnReset = jest.fn();
  const defaultSettings = createBlankPageInfo();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with required props", () => {
    render(
      <ResizablePageSettingsPanel
        targetFile="page-001.jpg"
        currentSettings={defaultSettings}
        onUpdateSettings={mockOnUpdateSettings}
        onReset={mockOnReset}
      />,
    );

    expect(screen.getByTestId("page-settings-panel")).toBeInTheDocument();
    expect(screen.getByText("Target: page-001.jpg")).toBeInTheDocument();
  });

  it("displays current settings", () => {
    const settings = {
      ...defaultSettings,
      Type: PageType.FrontCover,
    };

    render(
      <ResizablePageSettingsPanel
        targetFile="page-001.jpg"
        currentSettings={settings}
        onUpdateSettings={mockOnUpdateSettings}
        onReset={mockOnReset}
      />,
    );

    expect(screen.getByText("Type: FrontCover")).toBeInTheDocument();
  });

  it("calls onUpdateSettings when update button is clicked", () => {
    render(
      <ResizablePageSettingsPanel
        targetFile="page-001.jpg"
        currentSettings={defaultSettings}
        onUpdateSettings={mockOnUpdateSettings}
        onReset={mockOnReset}
      />,
    );

    const updateButton = screen.getByTestId("update-button");
    updateButton.click();

    expect(mockOnUpdateSettings).toHaveBeenCalledWith({
      Type: PageType.FrontCover,
    });
  });

  it("calls onReset when reset button is clicked", () => {
    render(
      <ResizablePageSettingsPanel
        targetFile="page-001.jpg"
        currentSettings={defaultSettings}
        onUpdateSettings={mockOnUpdateSettings}
        onReset={mockOnReset}
      />,
    );

    const resetButton = screen.getByTestId("reset-button");
    resetButton.click();

    expect(mockOnReset).toHaveBeenCalled();
  });

  it("uses default size values for Panel", () => {
    render(
      <ResizablePageSettingsPanel
        targetFile="page-001.jpg"
        currentSettings={defaultSettings}
        onUpdateSettings={mockOnUpdateSettings}
        onReset={mockOnReset}
      />,
    );

    const panel = screen.getByTestId("panel");
    expect(panel).toHaveAttribute("data-default-size", "25");
    expect(panel).toHaveAttribute("data-min-size", "15");
    expect(panel).toHaveAttribute("data-max-size", "60");
  });

  it("uses custom size values for Panel", () => {
    render(
      <ResizablePageSettingsPanel
        targetFile="page-001.jpg"
        currentSettings={defaultSettings}
        onUpdateSettings={mockOnUpdateSettings}
        onReset={mockOnReset}
        defaultSize={35}
        minSize={20}
        maxSize={75}
      />,
    );

    const panel = screen.getByTestId("panel");
    expect(panel).toHaveAttribute("data-default-size", "35");
    expect(panel).toHaveAttribute("data-min-size", "20");
    expect(panel).toHaveAttribute("data-max-size", "75");
  });

  it("handles null targetFile", () => {
    render(
      <ResizablePageSettingsPanel
        targetFile={null}
        currentSettings={defaultSettings}
        onUpdateSettings={mockOnUpdateSettings}
        onReset={mockOnReset}
      />,
    );

    expect(screen.getByText("Target: none")).toBeInTheDocument();
  });

  it("passes optional props to wrapped component", () => {
    const mockOnSave = jest.fn();
    const errorMsg = "Test error";

    render(
      <ResizablePageSettingsPanel
        targetFile="page-001.jpg"
        currentSettings={defaultSettings}
        onUpdateSettings={mockOnUpdateSettings}
        onReset={mockOnReset}
        showSaveButton={true}
        onSave={mockOnSave}
        isSaving={false}
        errorMessage={errorMsg}
        showMarkAsTocButton={true}
      />,
    );

    expect(screen.getByTestId("page-settings-panel")).toBeInTheDocument();
  });
});
