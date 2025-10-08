import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import XmlEditor from "../XmlEditor";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Mock Monaco Editor
jest.mock("@monaco-editor/react", () => {
  return function MockEditor({ value, onChange }: any) {
    return (
      <textarea
        data-testid="xml-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
});

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { path: "/test/path" },
  }),
}));

// Mock custom hooks
jest.mock("@/hooks/useComicInfoXML", () => ({
  useComicInfoXML: () => ({
    xml: "<ComicInfo></ComicInfo>",
    setXml: jest.fn(),
    isValid: true,
    isValidating: false,
    validationMessage: null,
    isSaving: false,
    hasUnsavedChanges: true,
    isDeleting: false,
    error: null,
    saveXml: jest.fn(),
    formatXml: jest.fn(),
    deleteXml: jest.fn(),
    resetXml: jest.fn(),
    validateXml: jest.fn(),
    clearValidation: jest.fn(),
  }),
}));

jest.mock("@/hooks/useXmlEditorUI", () => ({
  useXmlEditorUI: () => ({
    saveSuccess: false,
    formatSuccess: false,
    deleteSuccess: false,
    showSuccessMessage: jest.fn(),
    clearAllMessages: jest.fn(),
    setDeleteDialogOpen: jest.fn(),
  }),
}));

jest.mock("../../ui/TooltipButton", () => {
  return function MockTooltipButton({
    onClick,
    disabled,
    children,
    tooltip,
  }: any) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        title={tooltip}
        data-testid={`tooltip-button-${children.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {children}
      </button>
    );
  };
});

jest.mock("../../ui/ConfirmationButton", () => {
  return function MockConfirmationButton({
    onConfirm,
    disabled,
    children,
  }: any) {
    return (
      <button
        onClick={onConfirm}
        disabled={disabled}
        data-testid={`confirmation-button-${children.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {children}
      </button>
    );
  };
});

describe("XmlEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with all components", () => {
    render(
      <ThemeProvider>
        <XmlEditor />
      </ThemeProvider>,
    );

    expect(screen.getByText("Edit ComicInfo.xml")).toBeInTheDocument();
    expect(screen.getByTestId("xml-editor")).toBeInTheDocument();
    expect(screen.getByText("Validate XML")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
    expect(screen.getByText("Delete ComicInfo.xml")).toBeInTheDocument();
  });

  it("displays XML content in editor", () => {
    render(
      <ThemeProvider>
        <XmlEditor />
      </ThemeProvider>,
    );

    const editor = screen.getByTestId("xml-editor");

    expect(editor).toHaveValue("<ComicInfo></ComicInfo>");
  });

  it("accepts onAfterSave callback", () => {
    const onAfterSave = jest.fn();

    render(
      <ThemeProvider>
        <XmlEditor onAfterSave={onAfterSave} />
      </ThemeProvider>,
    );

    // Component should render without error
    expect(screen.getByText("Edit ComicInfo.xml")).toBeInTheDocument();
  });

  it("accepts onAfterDelete callback", () => {
    const onAfterDelete = jest.fn();

    render(
      <ThemeProvider>
        <XmlEditor onAfterDelete={onAfterDelete} />
      </ThemeProvider>,
    );

    // Component should render without error
    expect(screen.getByText("Edit ComicInfo.xml")).toBeInTheDocument();
  });

  it("renders buttons and allows interaction", () => {
    render(
      <ThemeProvider>
        <XmlEditor />
      </ThemeProvider>,
    );

    const validateButton = screen.getByText("Validate XML");
    const saveButton = screen.getByText("Save");
    const formatButton = screen.getByText("Format");

    expect(validateButton).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();
    expect(formatButton).toBeInTheDocument();

    // Buttons should be clickable (not disabled in the default mock state)
    fireEvent.click(validateButton);
    fireEvent.click(saveButton);
    fireEvent.click(formatButton);
  });
});
