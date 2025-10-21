import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResizablePagePreviewPanel from "../ResizablePagePreviewPanel";

jest.mock("@/components/pages/PreviewPanel", () => {
  return function MockPagePreviewPanel({
    targetFile,
    targetPageNumber,
    title,
    buttons,
  }: any) {
    return (
      <div data-testid="page-preview-panel">
        <div>Title: {title}</div>
        <div>Target: {targetFile || "none"}</div>
        <div>Page: {targetPageNumber || ""}</div>
        {buttons?.map((button: any, index: number) => (
          <button
            key={index}
            onClick={button.onClick}
            disabled={button.disabled}
            data-testid={`preview-button-${index}`}
          >
            {button.label}
          </button>
        ))}
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

describe("ResizablePagePreviewPanel", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with required props", () => {
    render(
      <ResizablePagePreviewPanel
        targetFile="page-001.jpg"
        targetPageNumber="1"
      />,
    );

    expect(screen.getByTestId("page-preview-panel")).toBeInTheDocument();
    expect(screen.getByText("Page: 1")).toBeInTheDocument();
  });

  it("passes title to wrapped component", () => {
    render(
      <ResizablePagePreviewPanel
        targetFile="page-001.jpg"
        targetPageNumber="1"
        title="Test Title"
      />,
    );

    expect(screen.getByText("Title: Test Title")).toBeInTheDocument();
  });

  it("passes buttons to wrapped component", () => {
    const mockOnClick = jest.fn();
    const buttons = [
      {
        label: "Test Button",
        onClick: mockOnClick,
        disabled: false,
      },
    ];

    render(
      <ResizablePagePreviewPanel
        targetFile="page-001.jpg"
        targetPageNumber="1"
        buttons={buttons}
      />,
    );

    expect(screen.getByText("Test Button")).toBeInTheDocument();
  });

  it("uses default size values for Panel", () => {
    render(
      <ResizablePagePreviewPanel
        targetFile="page-001.jpg"
        targetPageNumber="1"
      />,
    );

    const panel = screen.getByTestId("panel");
    expect(panel).toHaveAttribute("data-default-size", "33");
    expect(panel).toHaveAttribute("data-min-size", "20");
    expect(panel).toHaveAttribute("data-max-size", "80");
  });

  it("uses custom size values for Panel", () => {
    render(
      <ResizablePagePreviewPanel
        targetFile="page-001.jpg"
        targetPageNumber="1"
        defaultSize={40}
        minSize={25}
        maxSize={70}
      />,
    );

    const panel = screen.getByTestId("panel");
    expect(panel).toHaveAttribute("data-default-size", "40");
    expect(panel).toHaveAttribute("data-min-size", "25");
    expect(panel).toHaveAttribute("data-max-size", "70");
  });

  it("handles null targetFile", () => {
    render(
      <ResizablePagePreviewPanel targetFile={null} targetPageNumber="1" />,
    );

    expect(screen.getByText("Target: none")).toBeInTheDocument();
  });
});
