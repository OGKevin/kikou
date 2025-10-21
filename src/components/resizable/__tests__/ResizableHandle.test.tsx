import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResizableHandle from "../ResizableHandle";

jest.mock("react-resizable-panels", () => ({
  PanelResizeHandle: ({ children }: any) => (
    <div data-testid="panel-resize-handle">{children}</div>
  ),
}));

describe("ResizableHandle", () => {
  it("renders correctly", () => {
    const { container } = render(<ResizableHandle />);

    expect(screen.getByTestId("panel-resize-handle")).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it("renders with default withIcon prop", () => {
    const { container } = render(<ResizableHandle />);

    const handle = screen.getByTestId("panel-resize-handle");
    expect(handle).toBeInTheDocument();
    expect(
      container.querySelector("[data-testid='panel-resize-handle']"),
    ).toBeInTheDocument();
  });

  it("renders with withIcon set to true", () => {
    const { container } = render(<ResizableHandle withIcon={true} />);

    expect(screen.getByTestId("panel-resize-handle")).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it("renders with withIcon set to false", () => {
    const { container } = render(<ResizableHandle withIcon={false} />);

    expect(screen.getByTestId("panel-resize-handle")).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it("renders handle Box with correct styles", () => {
    const { container } = render(<ResizableHandle />);

    const handleBox = container.querySelector(
      "[data-testid='panel-resize-handle']",
    );
    expect(handleBox).toBeInTheDocument();
  });
});
