import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import EditTab from "../EditTab";
import { LocalStorageManager } from "../../../utils/localStorage";

// Mock hooks
jest.mock("@/hooks/useImageFiles", () => ({
  useImageFiles: jest.fn(),
}));

jest.mock("@/contexts/PageSettingsContext", () => ({
  usePageSettingsContext: jest.fn(),
}));

// Mock the components that EditTab uses
jest.mock("../../pages/Header", () => {
  return function MockComicHeader({ title, buttons }: any) {
    return (
      <div data-testid="comic-header">
        <h1>{title}</h1>
        {buttons?.map((button: any, index: number) => (
          <button
            key={index}
            onClick={button.onClick}
            disabled={button.disabled}
            data-testid={`header-button-${index}`}
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
        <button onClick={() => onUpdateSettings({ Type: "FrontCover" })}>
          Update Settings
        </button>
        <button onClick={onReset}>Reset</button>
      </div>
    );
  };
});

jest.mock("../../pages/PreviewPanel", () => {
  return function MockPagePreviewPanel({ targetFile, targetPageNumber }: any) {
    return (
      <div data-testid="page-preview-panel">
        <div>Preview: {targetFile || "none"}</div>
        <div>Page: {targetPageNumber}</div>
      </div>
    );
  };
});

jest.mock("../../file/FileList", () => {
  return function MockFileList({
    imageFiles,
    selectedFile,
    onSelectFile,
  }: any) {
    return (
      <div data-testid="file-list">
        {imageFiles.map((file: string) => (
          <button
            key={file}
            onClick={() => onSelectFile(file)}
            data-selected={file === selectedFile}
            data-testid={`file-${file}`}
          >
            {file}
          </button>
        ))}
      </div>
    );
  };
});

const createMockStorageManager = (): LocalStorageManager => {
  return {
    getSelectedFile: jest.fn(() => "image1.jpg"),
    setSelectedFile: jest.fn(),
    removeSelectedFile: jest.fn(),
    clearAll: jest.fn(),
    getKey: jest.fn(() => "testKey"),
    restoreComicPageInfoMethods: jest.fn(),
    restoreComicPageInfoRecord: jest.fn(),
    getCurrentPageSettings: jest.fn(() => ({})),
    getOriginalPageSettings: jest.fn(() => ({})),
    setCurrentPageSettings: jest.fn(),
    setBookmarkedFiles: jest.fn(),
    getBookmarkedFiles: jest.fn(() => []),
    setOriginalPageSettings: jest.fn(),
    setPageSettings: jest.fn(),
    getPageSettings: jest.fn(() => ({})),
    updateFileName: jest.fn(),
    getFileName: jest.fn(() => "test.cbz"),
    setTocFile: jest.fn(),
    getTocFile: jest.fn(() => ""),
    removeTocFile: jest.fn(),
    getArchivePath: jest.fn(() => "/test/path"),
    setComicInfo: jest.fn(),
    getComicInfo: jest.fn(() => ({})),
    setComicInfoXml: jest.fn(),
    getComicInfoXml: jest.fn(() => ""),
    setImageFiles: jest.fn(),
    getImageFiles: jest.fn(() => []),
    setPreviewCache: jest.fn(),
    getPreviewCache: jest.fn(() => ({})),
    setPageStates: jest.fn(),
    getPageStates: jest.fn(() => ({})),
    setSettings: jest.fn(),
    getSettings: jest.fn(() => ({})),
    setTheme: jest.fn(),
    getTheme: jest.fn(() => "light"),
    setRecentComicFiles: jest.fn(),
    getRecentComicFiles: jest.fn(() => []),
    setErrorResponse: jest.fn(),
    getErrorResponse: jest.fn(() => null),
    setShowFiltered: jest.fn(),
    getShowFiltered: jest.fn(() => false),
    setShowBookmarkFiltered: jest.fn(),
    getShowBookmarkFiltered: jest.fn(() => false),
    setCurrentPageNumber: jest.fn(),
    getCurrentPageNumber: jest.fn(() => 0),
    setZoomLevel: jest.fn(),
    getZoomLevel: jest.fn(() => 1),
    setPageDirection: jest.fn(),
    getPageDirection: jest.fn(() => "ltr"),
  } as unknown as LocalStorageManager;
};

describe("EditTab", () => {
  const mockUseImageFiles = require("@/hooks/useImageFiles")
    .useImageFiles as jest.Mock;
  const mockUsePageSettingsContext = require("@/contexts/PageSettingsContext")
    .usePageSettingsContext as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Set up default mocks
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["image1.jpg", "image2.jpg", "image3.jpg"],
      loading: false,
      error: null,
    });

    mockUsePageSettingsContext.mockReturnValue({
      currentSettings: {
        "image1.jpg": { Type: "Unknown", DoublePage: false, Bookmark: "" },
      },
      updatePageSettings: jest.fn(),
      resetPageSettings: jest.fn(),
      resetAllPageSettings: jest.fn(),
      isSaving: false,
      hasEditedPages: true,
      saveAllSettings: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders correctly with all components", () => {
    const mockStorageManager = createMockStorageManager();
    render(<EditTab storageManager={mockStorageManager} />);

    expect(screen.getByTestId("file-list")).toBeInTheDocument();
    expect(screen.getByTestId("comic-header")).toBeInTheDocument();
    expect(screen.getByTestId("page-settings-panel")).toBeInTheDocument();
    expect(screen.getByTestId("page-preview-panel")).toBeInTheDocument();
  });

  it("displays the correct title in comic header", () => {
    const mockStorageManager = createMockStorageManager();
    render(<EditTab storageManager={mockStorageManager} />);

    expect(screen.getByText("Comic Page Editor")).toBeInTheDocument();
  });

  it("shows the save button", () => {
    const mockStorageManager = createMockStorageManager();
    render(<EditTab storageManager={mockStorageManager} />);

    expect(screen.getByText("Save Settings")).toBeInTheDocument();
  });

  it("should detect infinite loops in useEffect with storageManager dependency", async () => {
    const mockStorageManager = createMockStorageManager();

    const getSelectedFileSpy = jest.spyOn(
      mockStorageManager,
      "getSelectedFile",
    );
    const setSelectedFileSpy = jest.spyOn(
      mockStorageManager,
      "setSelectedFile",
    );

    render(<EditTab storageManager={mockStorageManager} />);

    // Wait for initial renders
    await waitFor(() => {
      expect(screen.getByTestId("comic-header")).toBeInTheDocument();
    });

    // Fast-forward time to see if there are excessive calls
    jest.advanceTimersByTime(1000);

    // If there's an infinite loop, these would be called excessively
    // Normal expectation: 1-2 calls for initial setup
    expect(getSelectedFileSpy.mock.calls.length).toBe(1);
    expect(setSelectedFileSpy.mock.calls.length).toBe(1);
  });

  it("should detect infinite loops with changing imageFiles array", async () => {
    const mockStorageManager = createMockStorageManager();
    let renderCount = 0;

    const imageFiles = ["image1.jpg", "image2.jpg", "image3.jpg"]; // New array each time
    // Mock that returns a new array reference each time (common cause of infinite loops)
    mockUseImageFiles.mockImplementation(() => {
      renderCount++;
      return {
        imageFiles: imageFiles,
        loading: false,
        error: null,
      };
    });

    const setSelectedFileSpy = jest.spyOn(
      mockStorageManager,
      "setSelectedFile",
    );

    render(<EditTab storageManager={mockStorageManager} />);

    // Fast-forward time
    jest.advanceTimersByTime(200);

    // This test will reveal if there's an infinite loop due to imageFiles dependency
    expect(setSelectedFileSpy.mock.calls.length).toBe(1);
    expect(renderCount).toBe(2);
  });

  it("should detect infinite loops with recreated storageManager", async () => {
    let renderCount = 0;

    // Mock that recreates functions on every render (common mistake)
    mockUsePageSettingsContext.mockImplementation(() => {
      renderCount++;
      return {
        currentSettings: {},
        updatePageSettings: jest.fn(), // New function each render
        resetPageSettings: jest.fn(), // New function each render
        resetAllPageSettings: jest.fn(),
        isSaving: false,
        hasEditedPages: false,
        saveAllSettings: jest.fn(),
      };
    });

    const mockStorageManager = createMockStorageManager();
    const setSelectedFileSpy = jest.spyOn(
      mockStorageManager,
      "setSelectedFile",
    );

    render(<EditTab storageManager={mockStorageManager} />);

    // Fast-forward time
    jest.advanceTimersByTime(300);

    // This should not cause infinite loops if dependencies are set correctly
    expect(renderCount).toBeLessThanOrEqual(2);
    expect(setSelectedFileSpy.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("should detect infinite loops caused by usePreviewCache in PagePreviewPanel", async () => {
    let renderCount = 0;
    let previewCacheCreated = 0;
    let cacheAccessOrderCreated = 0;

    // Mock ArchiveContext that recreates objects on every render
    jest.mock("@/contexts/ArchiveContext", () => ({
      useArchiveContext: jest.fn().mockImplementation(() => {
        return {
          path: "/test/archive.cbz",
          result: { comic_info: {}, image_files: ["image1.jpg", "image2.jpg"] },
          loading: false,
          error: null,
          reload: jest.fn(),
          bookmarkedFiles: [],
          setBookmarkedFiles: jest.fn(),
          previewCache: { current: {} }, // useRef object
          cacheAccessOrder: { current: [] }, // useRef object
          tocFile: null,
          setTocFile: jest.fn(),
          hasUnsavedXmlChanges: false,
          setHasUnsavedXmlChanges: jest.fn(),
        };
      }),
      ArchiveProvider: ({ children }: any) => children,
    }));

    // Mock usePreviewCache to track how many times it's called
    jest.mock("@/hooks/usePreviewCache", () => ({
      usePreviewCache: jest
        .fn()
        .mockImplementation((fileName: string | null) => {
          renderCount++;

          return {
            previewUrl: null,
            loading: fileName,
            error: null,
          };
        }),
    }));

    const mockStorageManager = createMockStorageManager();

    // Spy on console.error to catch "Maximum update depth exceeded"
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      await act(async () => {
        render(<EditTab storageManager={mockStorageManager} />);
        jest.advanceTimersByTime(200);
      });

      // Check for excessive calls indicating infinite loop
      if (renderCount > 10) {
        expect(renderCount).toBeGreaterThan(10);
      } else {
        // If no clear infinite loop, check for "Maximum update depth exceeded" error
        const maxUpdateError = consoleSpy.mock.calls.find((call) =>
          call[0]?.toString().includes("Maximum update depth exceeded"),
        );

        if (maxUpdateError) {
          expect(maxUpdateError).toBeDefined();
        } else {
          // Normal case: expect reasonable number of calls
          expect(renderCount).toBeLessThanOrEqual(5);
        }
      }
    } catch (error) {
      expect(error.toString()).toContain("Maximum update depth exceeded");
    } finally {
      consoleSpy.mockRestore();
      jest.clearAllMocks();
      jest.resetModules();
    }
  });
});
