import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import XmlTab from "../XmlTab";
import XmlEditor from "../XmlEditor";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Tabs } from "@mui/joy";

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

describe("XmlTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the XmlTab component with XmlEditor inside", () => {
    render(
      <ThemeProvider>
        <Tabs defaultValue="xml">
          <XmlTab />
        </Tabs>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("xml-editor")).toBeInTheDocument();
    expect(screen.getByText("Edit ComicInfo.xml")).toBeInTheDocument();
  });

  it("renders XmlEditor correctly when imported standalone", () => {
    render(
      <ThemeProvider>
        <XmlEditor />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("xml-editor")).toBeInTheDocument();
    expect(screen.getByText("Edit ComicInfo.xml")).toBeInTheDocument();
  });
});
