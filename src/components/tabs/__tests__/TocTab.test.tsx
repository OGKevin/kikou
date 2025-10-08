import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TocTab from "../TocTab";
import { LocalStorageManager } from "../../../utils/localStorage";

// Mock hooks and contexts
jest.mock("@/contexts/ArchiveContext", () => ({
  useArchiveContext: () => ({
    tocFile: "toc-page.jpg",
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
  return function MockPageSelector({
    onPageNumberChange,
    onUseFileNameChange,
    imageFiles,
  }: any) {
    return (
      <div data-testid="page-selector">
        <input
          data-testid="page-number-input"
          onChange={(e) => onPageNumberChange(e.target.value, false)}
        />
        <input
          type="checkbox"
          data-testid="use-filename-checkbox"
          onChange={(e) => onUseFileNameChange(e.target.checked)}
        />
        <div>Target File: none</div>
        <div>Image Files: {imageFiles.length}</div>
      </div>
    );
  };
});

const mockStorageManager = {
  getSelectedFile: jest.fn(() => "page-005.jpg"),
  setSelectedFile: jest.fn(),
} as unknown as LocalStorageManager;

describe("TocTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with all components", () => {
    render(<TocTab />);

    expect(screen.getAllByTestId("page-preview-panel")).toHaveLength(2);
    expect(screen.getByTestId("page-selector")).toBeInTheDocument();
    expect(screen.getByTestId("page-settings-panel")).toBeInTheDocument();
  });

  it("shows the correct toc file and target page", () => {
    render(<TocTab />);

    // ToC preview should show the toc file
    const tocPreview = screen.getAllByTestId("page-preview-panel")[0];

    expect(tocPreview).toHaveTextContent("Title: Table of Contents");
    expect(tocPreview).toHaveTextContent("Target: toc-page.jpg");
  });
});
