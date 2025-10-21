import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TocTab from "../TocTab";

// Mock hooks and contexts
jest.mock("@/contexts/ArchiveContext", () => ({
  useArchiveContext: () => ({
    tocFile: "toc-page.jpg",
    selectedPage: 0,
    setSelectedPage: jest.fn(),
    loading: false,
    result: null,
    error: null,
  }),
}));

jest.mock("@/contexts/PageSettingsContext", () => ({
  usePageSettingsContext: () => ({
    currentSettings: {
      "page-005.jpg": { Type: "Unknown", DoublePage: false, Bookmark: "" },
    },
    updatePageSettings: jest.fn(),
    resetPageSettings: jest.fn(),
    isSaving: false,
    hasEditedPages: true,
    saveAllSettings: jest.fn(),
  }),
}));

jest.mock("@/hooks/useImageFiles", () => ({
  useImageFiles: () => ({
    imageFiles: ["page-001.jpg", "page-002.jpg", "page-005.jpg"],
    loading: false,
    error: null,
  }),
}));

// Mock components
jest.mock("../../pages/PreviewPanel", () => {
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

jest.mock("../../pages/SettingsPanel", () => {
  return function MockPageSettingsPanel({
    targetFile,
    onUpdateSettings,
    onReset,
  }: any) {
    return (
      <div data-testid="page-settings-panel">
        <div>Target: {targetFile || "none"}</div>
        <button onClick={() => onUpdateSettings({ Type: "TableOfContents" })}>
          Update Settings
        </button>
        <button onClick={onReset}>Reset</button>
      </div>
    );
  };
});

jest.mock("../../pages/Selector", () => {
  return function MockPageSelector({ id, onPageIndexChange, imageFiles }: any) {
    return (
      <div data-testid="page-selector" id={id}>
        <input
          data-testid="page-index-input"
          onChange={(e) => onPageIndexChange(parseInt(e.target.value))}
        />
        <div>Image Files: {imageFiles.length}</div>
      </div>
    );
  };
});

jest.mock("@/components/resizable/ResizablePagePreviewPanel", () => {
  return function MockResizablePagePreviewPanel({
    targetFile,
    targetPageNumber,
    title,
    buttons,
  }: any) {
    return (
      <div data-testid="resizable-page-preview-panel">
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

jest.mock("@/components/resizable/ResizablePageSettingsPanel", () => {
  return function MockResizablePageSettingsPanel({
    targetFile,
    onUpdateSettings,
    onReset,
  }: any) {
    return (
      <div data-testid="resizable-page-settings-panel">
        <div>Target: {targetFile || "none"}</div>
        <button onClick={() => onUpdateSettings({ Type: "TableOfContents" })}>
          Update Settings
        </button>
        <button onClick={onReset}>Reset</button>
      </div>
    );
  };
});

jest.mock("@/components/resizable/ResizableHandle", () => {
  return function MockResizableHandle() {
    return <div data-testid="resizable-handle" />;
  };
});

jest.mock("react-resizable-panels", () => ({
  PanelGroup: ({ children, direction }: any) => (
    <div data-testid="panel-group" data-direction={direction}>
      {children}
    </div>
  ),
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  PanelResizeHandle: ({ children }: any) => (
    <div data-testid="panel-resize-handle">{children}</div>
  ),
}));

describe("TocTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with all components", () => {
    render(<TocTab />);

    expect(screen.getByTestId("page-selector")).toBeInTheDocument();
    expect(screen.getByTestId("panel-group")).toBeInTheDocument();
    expect(screen.getAllByTestId("resizable-page-preview-panel")).toHaveLength(
      2,
    );
    expect(
      screen.getByTestId("resizable-page-settings-panel"),
    ).toBeInTheDocument();
  });

  it("shows the correct toc file and target page", () => {
    render(<TocTab />);

    const previews = screen.getAllByTestId("resizable-page-preview-panel");
    const tocPreview = previews[0];

    expect(tocPreview).toHaveTextContent("Title: Table of Contents");
    expect(tocPreview).toHaveTextContent("Target: toc-page.jpg");
  });

  it("renders page selector", () => {
    render(<TocTab />);

    expect(screen.getByTestId("page-selector")).toBeInTheDocument();
    expect(screen.getByText("Image Files: 3")).toBeInTheDocument();
  });

  it("renders page settings panel with correct target file", () => {
    render(<TocTab />);

    const settingsPanel = screen.getByTestId("resizable-page-settings-panel");
    expect(settingsPanel).toHaveTextContent("Target: page-001.jpg");
  });

  it("renders resizable handles between panels", () => {
    render(<TocTab />);

    const handles = screen.getAllByTestId("resizable-handle");
    expect(handles.length).toBeGreaterThan(0);
  });

  it("renders panel group with horizontal direction", () => {
    render(<TocTab />);

    const panelGroup = screen.getByTestId("panel-group");
    expect(panelGroup).toHaveAttribute("data-direction", "horizontal");
  });

  it("shows save button in header", () => {
    render(<TocTab />);

    const saveButton = screen.getByText("Save Settings");
    expect(saveButton).toBeInTheDocument();
  });

  it("renders selector and save button", () => {
    render(<TocTab />);

    expect(screen.getByTestId("page-selector")).toBeInTheDocument();
    expect(screen.getByText("Save Settings")).toBeInTheDocument();
  });
});
