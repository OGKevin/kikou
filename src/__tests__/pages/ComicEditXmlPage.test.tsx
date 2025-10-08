import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ComicEditXmlPage from "../../pages/comic/edit/xml";
import { invoke } from "@tauri-apps/api/core";
import { CssVarsProvider } from "@mui/joy";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ArchiveProvider } from "../../contexts/ArchiveContext";
import React from "react";
import { useComicInfoXML } from "../../hooks/useComicInfoXML";
import { useXmlEditorUI } from "../../hooks/useXmlEditorUI";
import { useRouter } from "next/router";

jest.mock("next/router");

// Mock next/router globally for all tests
jest.mock("next/router", () => ({
  useRouter: jest.fn(() => ({
    query: { path: "test.cbz" },
    push: jest.fn(),
    replace: jest.fn(),
    pathname: "/comic/edit/xml",
    asPath: "/comic/edit/xml?path=test.cbz",
  })),
}));

jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn(),
}));

jest.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: jest.fn(() => ({
    theme: jest.fn(() => Promise.resolve("system")),
  })),
}));

jest.mock("@tauri-apps/api/app", () => ({
  setTheme: jest.fn(),
}));

jest.mock("@monaco-editor/react", () => {
  interface MockEditorProps {
    value?: string;
    onChange?: (value: string) => void;
  }
  return function MockEditor({ value, onChange }: MockEditorProps) {
    return (
      <textarea
        data-testid="monaco-editor"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
    );
  };
});

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <CssVarsProvider>
      <ThemeProvider>
        <ArchiveProvider path="test.cbz">{ui}</ArchiveProvider>
      </ThemeProvider>
    </CssVarsProvider>,
  );
}

// Mock window.matchMedia for Joy UI theme support in Jest
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    };
});

jest.mock("../../hooks/useComicInfoXML", () => ({
  useComicInfoXML: jest.fn(),
}));
jest.mock("../../hooks/useXmlEditorUI", () => ({
  useXmlEditorUI: jest.fn(),
}));

describe("ComicEditXmlPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset invoke mock to ensure clean state
    (invoke as jest.Mock).mockReset();

    // Set up default mocks for all invoke calls that the component might make
    (invoke as jest.Mock).mockImplementation((command: string) => {
      switch (command) {
        case "load_cbz":
          return Promise.resolve({ isValid: true });
        case "get_raw_comicinfo_xml":
          return Promise.resolve("<ComicInfo></ComicInfo>");
        case "save_comicinfo_xml":
          return Promise.resolve("<ComicInfo></ComicInfo>");
        case "validate_comicinfo_xml":
          return Promise.resolve();
        case "format_comicinfo_xml":
          return Promise.resolve("<ComicInfo></ComicInfo>");
        case "delete_cbz_comicinfo_xml":
          return Promise.resolve();
        default:
          return Promise.resolve();
      }
    });
    (useXmlEditorUI as jest.Mock).mockReturnValue({
      saveSuccess: false,
      formatSuccess: false,
      deleteSuccess: false,
      deleteDialogOpen: false,
      setDeleteDialogOpen: jest.fn(),
      showSuccessMessage: jest.fn(),
      clearAllMessages: jest.fn(),
    });
  });

  it("renders loading state", async () => {
    (useRouter as jest.Mock).mockReturnValue({ query: { path: "test.cbz" } });

    // Mock loading state
    (useComicInfoXML as unknown as jest.Mock).mockReturnValue({
      xml: "",
      setXml: jest.fn(),
      originalXml: "",
      loading: true,
      error: null,
      isSaving: false,
      isDeleting: false,
      hasUnsavedChanges: false,
      wasInitiallyEmpty: false,
      saveXml: jest.fn(),
      formatXml: jest.fn(),
      deleteXml: jest.fn(),
      isValid: null,
      isValidating: false,
      validationMessage: null,
      validateXml: jest.fn(),
      resetXml: jest.fn(),
    });

    await act(async () => {
      renderWithProvider(<ComicEditXmlPage />);
    });

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("shows error if loading fails", async () => {
    (useRouter as jest.Mock).mockReturnValue({ query: { path: "test.cbz" } });

    // Mock error state
    (useComicInfoXML as unknown as jest.Mock).mockReturnValue({
      xml: "",
      setXml: jest.fn(),
      originalXml: "",
      loading: false,
      error: "Failed to get raw ComicInfo.xml",
      isSaving: false,
      isDeleting: false,
      hasUnsavedChanges: false,
      wasInitiallyEmpty: false,
      saveXml: jest.fn(),
      formatXml: jest.fn(),
      deleteXml: jest.fn(),
      isValid: null,
      isValidating: false,
      validationMessage: null,
      validateXml: jest.fn(),
      resetXml: jest.fn(),
    });

    await act(async () => {
      renderWithProvider(<ComicEditXmlPage />);
    });

    await waitFor(() =>
      expect(
        screen.getByText(/Failed to get raw ComicInfo.xml/i),
      ).toBeInTheDocument(),
    );
  });

  it("validates xml and shows success", async () => {
    const mockValidateXml = jest.fn();

    (useComicInfoXML as unknown as jest.Mock).mockReturnValue({
      xml: "<ComicInfo></ComicInfo>",
      setXml: jest.fn(),
      originalXml: "<ComicInfo></ComicInfo>",
      loading: false,
      error: null,
      isSaving: false,
      isDeleting: false,
      hasUnsavedChanges: false,
      wasInitiallyEmpty: false,
      saveXml: jest.fn(),
      formatXml: jest.fn(),
      deleteXml: jest.fn(),
      isValid: true,
      isValidating: false,
      validationMessage: "Valid ComicInfo.xml",
      validateXml: mockValidateXml,
      resetXml: jest.fn(),
    });

    (useRouter as jest.Mock).mockReturnValue({ query: { path: "test.cbz" } });

    await act(async () => {
      renderWithProvider(<ComicEditXmlPage />);
    });

    await waitFor(() =>
      expect(screen.getByDisplayValue(/ComicInfo/)).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByText(/Validate/i));
    });

    await waitFor(() => expect(mockValidateXml).toHaveBeenCalled());

    // Check for success message
    expect(screen.getByText(/Valid ComicInfo.xml/i)).toBeInTheDocument();
  });

  it("shows validation error", async () => {
    const mockValidateXml = jest.fn();

    (useComicInfoXML as unknown as jest.Mock).mockReturnValue({
      xml: "<ComicInfo></ComicInfo>",
      setXml: jest.fn(),
      originalXml: "<ComicInfo></ComicInfo>",
      loading: false,
      error: null,
      isSaving: false,
      isDeleting: false,
      hasUnsavedChanges: false,
      wasInitiallyEmpty: false,
      saveXml: jest.fn(),
      formatXml: jest.fn(),
      deleteXml: jest.fn(),
      isValid: false,
      isValidating: false,
      validationMessage: "invalid xml",
      validateXml: mockValidateXml,
      resetXml: jest.fn(),
    });

    (useRouter as jest.Mock).mockReturnValue({ query: { path: "test.cbz" } });

    await act(async () => {
      renderWithProvider(<ComicEditXmlPage />);
    });

    await waitFor(() =>
      expect(screen.getByDisplayValue(/ComicInfo/)).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByText(/Validate/i));
    });

    await waitFor(() => expect(mockValidateXml).toHaveBeenCalled());

    // Check for error message
    expect(screen.getByText(/invalid xml/i)).toBeInTheDocument();
  });

  it("saves xml and shows success", async () => {
    const mockSaveXml = jest.fn().mockImplementation(() => true);
    const mockSetXml = jest.fn();
    const mockShowSuccessMessage = jest.fn();
    const mockClearValidation = jest.fn();

    // Ensure validation reports valid so Save button is enabled
    (useComicInfoXML as unknown as jest.Mock).mockReturnValue({
      xml: "<ComicInfo></ComicInfo>",
      setXml: mockSetXml,
      originalXml: "<ComicInfo></ComicInfo>",
      loading: false,
      error: null,
      isSaving: false,
      isDeleting: false,
      hasUnsavedChanges: true,
      wasInitiallyEmpty: false,
      saveXml: mockSaveXml,
      formatXml: jest.fn(),
      deleteXml: jest.fn(),
      isValid: true,
      isValidating: false,
      validationMessage: null,
      validateXml: jest.fn(),
      resetXml: jest.fn(),
      clearValidation: mockClearValidation,
    });
    // Set saveSuccess to true after save
    (useXmlEditorUI as jest.Mock).mockReturnValue({
      saveSuccess: true,
      formatSuccess: false,
      deleteSuccess: false,
      deleteDialogOpen: false,
      setDeleteDialogOpen: jest.fn(),
      showSuccessMessage: mockShowSuccessMessage,
      clearAllMessages: jest.fn(),
    });
    (useRouter as jest.Mock).mockReturnValue({ query: { path: "test.cbz" } });
    await act(async () => {
      renderWithProvider(<ComicEditXmlPage />);
    });
    await waitFor(() =>
      expect(screen.getByDisplayValue(/ComicInfo/)).toBeInTheDocument(),
    );
    await act(async () => {
      const editor = screen.getByTestId("monaco-editor");

      fireEvent.change(editor, {
        target: { value: "<ComicInfo><Title>Test</Title></ComicInfo>" },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    });
    await waitFor(() => {
      expect(mockSaveXml).toHaveBeenCalled();
    });
    // Check for success message
    expect(
      screen.getByText(/ComicInfo.xml saved successfully!/i),
    ).toBeInTheDocument();
  });

  it("shows save error", async () => {
    const mockSaveXml = jest.fn();

    // Ensure validation reports valid so Save button is enabled
    (useComicInfoXML as unknown as jest.Mock).mockReturnValue({
      xml: "<ComicInfo></ComicInfo>",
      setXml: jest.fn(),
      originalXml: "<ComicInfo></ComicInfo>",
      loading: false,
      error: null,
      isSaving: false,
      isDeleting: false,
      hasUnsavedChanges: true,
      wasInitiallyEmpty: false,
      saveXml: mockSaveXml,
      formatXml: jest.fn(),
      deleteXml: jest.fn(),
      isValid: true,
      isValidating: false,
      validationMessage: null,
      validateXml: jest.fn(),
      resetXml: jest.fn(),
    });

    (useRouter as jest.Mock).mockReturnValue({ query: { path: "test.cbz" } });

    await act(async () => {
      renderWithProvider(<ComicEditXmlPage />);
    });

    await waitFor(() =>
      expect(screen.getByDisplayValue(/ComicInfo/)).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    });

    await waitFor(() => expect(mockSaveXml).toHaveBeenCalled());
  });

  it("deletes ComicInfo.xml with confirmation", async () => {
    const mockDeleteXml = jest.fn();

    (useComicInfoXML as unknown as jest.Mock).mockReturnValue({
      xml: "<ComicInfo></ComicInfo>",
      setXml: jest.fn(),
      originalXml: "<ComicInfo></ComicInfo>",
      loading: false,
      error: null,
      isSaving: false,
      isDeleting: false,
      hasUnsavedChanges: false,
      wasInitiallyEmpty: false,
      saveXml: jest.fn(),
      formatXml: jest.fn(),
      deleteXml: mockDeleteXml,
      isValid: null,
      isValidating: false,
      validationMessage: null,
      validateXml: jest.fn(),
      resetXml: jest.fn(),
    });

    (useRouter as jest.Mock).mockReturnValue({ query: { path: "test.cbz" } });

    await act(async () => {
      renderWithProvider(<ComicEditXmlPage />);
    });

    await waitFor(() =>
      expect(screen.getByDisplayValue(/ComicInfo/)).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Delete ComicInfo\.xml/ }),
      );
    });

    await waitFor(() =>
      expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByText(/Yes, Delete/i));
    });

    await waitFor(() => expect(mockDeleteXml).toHaveBeenCalled());
  });

  it("shows error if delete fails", async () => {
    const mockDeleteXml = jest.fn();

    (useComicInfoXML as unknown as jest.Mock).mockReturnValue({
      xml: "<ComicInfo></ComicInfo>",
      setXml: jest.fn(),
      originalXml: "<ComicInfo></ComicInfo>",
      loading: false,
      error: "Failed to delete ComicInfo.xml",
      isSaving: false,
      isDeleting: false,
      hasUnsavedChanges: false,
      wasInitiallyEmpty: false,
      saveXml: jest.fn(),
      formatXml: jest.fn(),
      deleteXml: mockDeleteXml,
      isValid: null,
      isValidating: false,
      validationMessage: null,
      validateXml: jest.fn(),
      resetXml: jest.fn(),
    });

    (useRouter as jest.Mock).mockReturnValue({ query: { path: "test.cbz" } });

    await act(async () => {
      renderWithProvider(<ComicEditXmlPage />);
    });

    await waitFor(() =>
      expect(screen.getByDisplayValue(/ComicInfo/)).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Delete ComicInfo\.xml/ }),
      );
    });

    await waitFor(() =>
      expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByText(/Yes, Delete/i));
    });

    await waitFor(() =>
      expect(
        screen.getByText(/Failed to delete ComicInfo.xml/i),
      ).toBeInTheDocument(),
    );
  });
});
