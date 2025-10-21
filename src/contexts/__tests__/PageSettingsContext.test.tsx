import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { invoke } from "@tauri-apps/api/core";
import {
  PageSettingsProvider,
  usePageSettingsContext,
} from "../PageSettingsContext";
import { ArchiveProvider } from "../ArchiveContext";
import { LocalStorageManager } from "../../utils/localStorage";
import {
  ComicPageInfo,
  createBlankPageInfo,
  newPageInfo,
  PageType,
} from "../../types/comic";

jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn(),
}));

jest.mock("../ArchiveContext", () => ({
  useArchiveContext: jest.fn(),
  ArchiveProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../hooks/useComicInfo", () => ({
  useComicInfo: jest.fn(),
}));

const mockUseArchiveContext = require("../ArchiveContext").useArchiveContext;
const mockUseComicInfo = require("../../hooks/useComicInfo").useComicInfo;

const mockedInvoke = invoke as unknown as jest.MockedFunction<typeof invoke>;

const createMockStorageManager = (): Partial<LocalStorageManager> => {
  const mock: Record<string, any> = {};

  return {
    getCurrentPageSettings: jest.fn(() => mock.currentPageSettings || {}),
    getOriginalPageSettings: jest.fn(() => mock.originalPageSettings || {}),
    setCurrentPageSettings: jest.fn((settings: any) => {
      mock.currentPageSettings = settings;
    }),
    setBookmarkedFiles: jest.fn((files: string[]) => {
      mock.bookmarkedFiles = files;
    }),
    setOriginalPageSettings: jest.fn((settings: any) => {
      mock.originalPageSettings = settings;
    }),
  };
};

const createMockArchiveContext = (overrides?: any) => ({
  result: { image_files: [], comic_info: null },
  loading: false,
  error: null,
  reload: jest.fn(),
  reloadComicInfo: jest.fn().mockResolvedValue(undefined),
  previewCache: { current: {} },
  tocFile: null,
  setTocFile: jest.fn(),
  hasUnsavedXmlChanges: false,
  setHasUnsavedXmlChanges: jest.fn(),
  selectedPage: 0,
  setSelectedPage: jest.fn(),
  ...overrides,
});

// A small consumer component to access the context method under test
const Consumer = () => {
  const ctx = usePageSettingsContext();
  const [result, setResult] = useState<string[] | null>(null);

  return (
    <div>
      <button
        onClick={async () => {
          const r = await ctx.saveAllSettings();

          setResult(r);
        }}
      >
        Save
      </button>
      <div data-testid="bookmarks">{result ? result.join(",") : ""}</div>
      <div data-testid="isSaving">{ctx.isSaving ? "true" : "false"}</div>
    </div>
  );
};

describe("PageSettingsContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for useComicInfo
    mockUseComicInfo.mockReturnValue({
      parsedComicInfo: {},
      loading: false,
      error: null,
      reloadComicInfo: jest.fn(),
    });
  });

  describe("isPageEdited", () => {
    it("should detect when a page has been edited", async () => {
      const mockStorage = createMockStorageManager();

      const originalSettings: Record<string, ComicPageInfo> = {
        "test.jpg": createBlankPageInfo(),
      };

      (mockStorage.getOriginalPageSettings as jest.Mock).mockReturnValue(
        originalSettings,
      );
      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        originalSettings,
      );

      const TestComponent = () => {
        const {
          isPageEdited,
          updatePageSettings,
          currentSettings,
          originalSettings,
        } = usePageSettingsContext();
        const [isEdited, setIsEdited] = useState(false);

        // Use useEffect to check for changes after state updates
        React.useEffect(() => {
          if (currentSettings["test.jpg"]) {
            const edited = isPageEdited("test.jpg");

            setIsEdited(edited);
          }
        }, [currentSettings, isPageEdited]);

        return (
          <div>
            <button
              onClick={() => {
                updatePageSettings("test.jpg", { Type: PageType.Story });
              }}
              data-testid="update-button"
            >
              Update
            </button>
            <div data-testid="is-edited">{isEdited.toString()}</div>
          </div>
        );
      };

      render(
        <PageSettingsProvider
          path="/test/path.cbz"
          storageManager={mockStorage as any}
        >
          <TestComponent />
        </PageSettingsProvider>,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockStorage.getCurrentPageSettings).toHaveBeenCalled();
      });

      const user = userEvent.setup();

      // Initially should not be edited
      expect(screen.getByTestId("is-edited")).toHaveTextContent("false");

      // Update the settings and check if it's detected as edited
      await user.click(screen.getByTestId("update-button"));

      // Should now be edited
      await waitFor(() => {
        expect(screen.getByTestId("is-edited")).toHaveTextContent("true");
      });
    });
  });
  describe("hasEditedPages", () => {
    it("should be true when any page is edited", async () => {
      const mockStorage = createMockStorageManager();

      const originalSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": createBlankPageInfo(),
        "page2.jpg": newPageInfo(PageType.Story, false, ""),
      };

      const currentSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": newPageInfo(PageType.FrontCover, false, ""), // Edited
        "page2.jpg": newPageInfo(PageType.Story, false, ""), // Not edited
      };

      (mockStorage.getOriginalPageSettings as jest.Mock).mockReturnValue(
        originalSettings,
      );
      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        currentSettings,
      );

      const TestComponent = () => {
        const { hasEditedPages } = usePageSettingsContext();

        return (
          <div>
            <div data-testid="has-edited">{hasEditedPages.toString()}</div>
          </div>
        );
      };

      // Mock ArchiveContext
      mockUseArchiveContext.mockReturnValue(
        createMockArchiveContext({
          result: { image_files: ["page1.jpg"], comic_info: null },
        }),
      );

      render(
        <ArchiveProvider path="/test/path.cbz">
          <PageSettingsProvider
            path="/test/path.cbz"
            storageManager={mockStorage as any}
          >
            <TestComponent />
          </PageSettingsProvider>
        </ArchiveProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("has-edited")).toHaveTextContent("true");
      });
    });

    it("should be false when no pages are edited", async () => {
      const mockStorage = createMockStorageManager();

      const settings: Record<string, ComicPageInfo> = {
        "page1.jpg": newPageInfo(PageType.Story, false, ""),
        "page2.jpg": createBlankPageInfo(),
      };

      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        settings,
      );

      // Mock useComicInfo to provide the same settings as original
      mockUseComicInfo.mockReturnValue({
        parsedComicInfo: settings,
        loading: false,
        error: null,
        reloadComicInfo: jest.fn(),
      });

      // Mock ArchiveContext to return comic_info that matches the settings
      mockUseArchiveContext.mockReturnValue(
        createMockArchiveContext({
          result: {
            image_files: ["page1.jpg", "page2.jpg"],
            comic_info: {
              Pages: [
                { Image: 0, Type: "Story", DoublePage: false, Bookmark: "" },
                { Image: 1, Type: "Unknown", DoublePage: false, Bookmark: "" },
              ],
            },
          },
        }),
      );

      const TestComponent = () => {
        const { hasEditedPages } = usePageSettingsContext();

        return (
          <div>
            <div data-testid="has-edited">{hasEditedPages.toString()}</div>
          </div>
        );
      };

      render(
        <PageSettingsProvider
          path="/test/path.cbz"
          storageManager={mockStorage as any}
        >
          <TestComponent />
        </PageSettingsProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("has-edited")).toHaveTextContent("false");
      });
    });
  });

  describe("saveAllSettings", () => {
    it("handles case when no pages are edited", async () => {
      const mockStorage = createMockStorageManager();

      const settings: Record<string, ComicPageInfo> = {
        "page1.jpg": newPageInfo(PageType.Story, false, ""),
        "page2.jpg": createBlankPageInfo(),
      };

      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        settings,
      );

      // Mock useComicInfo to provide the same settings as original
      mockUseComicInfo.mockReturnValue({
        parsedComicInfo: settings,
        loading: false,
        error: null,
        reloadComicInfo: jest.fn(),
      });

      // Mock ArchiveContext to return comic_info that matches the settings
      mockUseArchiveContext.mockReturnValue(
        createMockArchiveContext({
          result: {
            image_files: ["page1.jpg", "page2.jpg"],
            comic_info: {
              Pages: [
                { Image: 0, Type: "Story", DoublePage: false, Bookmark: "" },
                { Image: 1, Type: "Unknown", DoublePage: false, Bookmark: "" },
              ],
            },
          },
        }),
      );

      const TestComponent = () => {
        const { saveAllSettings } = usePageSettingsContext();
        const [saveCompleted, setSaveCompleted] = useState(false);

        return (
          <div>
            <button
              onClick={async () => {
                await saveAllSettings();
                setSaveCompleted(true);
              }}
              data-testid="save-button"
            >
              Save
            </button>
            <div data-testid="save-completed">{saveCompleted.toString()}</div>
          </div>
        );
      };

      render(
        <PageSettingsProvider
          path="/test/path.cbz"
          storageManager={mockStorage as any}
        >
          <TestComponent />
        </PageSettingsProvider>,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockStorage.getCurrentPageSettings).toHaveBeenCalled();
      });

      const user = userEvent.setup();

      // Trigger save
      await user.click(screen.getByTestId("save-button"));

      // Should not call invoke since no pages were edited
      expect(mockedInvoke).not.toHaveBeenCalled();

      // Save should still complete successfully
      await waitFor(() => {
        expect(screen.getByTestId("save-completed")).toHaveTextContent("true");
      });
    });

    it("invokes backend, updates storage and returns bookmarked files", async () => {
      const mockStorage = createMockStorageManager();

      const currentSettings: Record<string, ComicPageInfo> = {
        "a.jpg": newPageInfo(PageType.Story, false, ""),
        "b.jpg": newPageInfo(PageType.Unknown, false, "important"),
      };

      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        currentSettings,
      );

      mockedInvoke.mockResolvedValue(undefined);

      render(
        <PageSettingsProvider
          path="/test/path.cbz"
          storageManager={mockStorage as any}
        >
          <Consumer />
        </PageSettingsProvider>,
      );

      // Wait for the provider's useEffect to load current settings from storage
      await waitFor(() => {
        expect(
          (mockStorage.getCurrentPageSettings as jest.Mock).mock.calls.length,
        ).toBeGreaterThanOrEqual(1);
      });

      const user = userEvent.setup();

      await user.click(screen.getByText("Save"));

      // Expect invoke called with transformed page settings
      const expectedBackend: Record<string, any> = {
        "a.jpg": {
          Type: currentSettings["a.jpg"].Type,
          DoublePage: false,
          Bookmark: "",
          Image: 0,
        },
        "b.jpg": {
          Type: currentSettings["b.jpg"].Type,
          DoublePage: false,
          Bookmark: "important",
          Image: 1,
        },
      };

      expect(mockedInvoke).toHaveBeenCalledWith("save_page_settings", {
        path: "/test/path.cbz",
        pageSettings: expectedBackend,
      });

      // storage manager should be updated with bookmarked files and original settings
      expect(
        (mockStorage.setBookmarkedFiles as jest.Mock).mock.calls.length,
      ).toBe(1);
      expect(
        (mockStorage.setBookmarkedFiles as jest.Mock).mock.calls[0][0],
      ).toEqual(["b.jpg"]);

      expect(
        (mockStorage.setOriginalPageSettings as jest.Mock).mock.calls.length,
      ).toBe(0);
    });
  });

  describe("resetAllPageSettings", () => {
    it("should reset all currentSettings to originalSettings", async () => {
      const mockStorage = createMockStorageManager();
      const originalSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": newPageInfo(PageType.Story, false, "bookmark1"),
        "page2.jpg": newPageInfo(PageType.FrontCover, false, ""),
      };
      const editedSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": newPageInfo(PageType.Unknown, true, "changed"),
        "page2.jpg": newPageInfo(PageType.BackCover, true, "changed2"),
      };

      (mockStorage.getOriginalPageSettings as jest.Mock).mockReturnValue(
        originalSettings,
      );
      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        editedSettings,
      );

      // Mock useComicInfo to provide the original settings as parsedComicInfo
      mockUseComicInfo.mockReturnValue({
        parsedComicInfo: originalSettings,
        loading: false,
        error: null,
      });

      const TestComponent = () => {
        const { currentSettings, resetAllPageSettings } =
          usePageSettingsContext();

        return (
          <div>
            <button
              onClick={() => resetAllPageSettings()}
              data-testid="reset-all-btn"
            >
              Reset All
            </button>
            <div data-testid="page1-type">
              {currentSettings["page1.jpg"]?.Type}
            </div>
            <div data-testid="page2-type">
              {currentSettings["page2.jpg"]?.Type}
            </div>
          </div>
        );
      };

      render(
        <PageSettingsProvider
          path="/test/path.cbz"
          storageManager={mockStorage as any}
        >
          <TestComponent />
        </PageSettingsProvider>,
      );

      // Wait for initial load - should show edited values first
      await waitFor(() => {
        expect(screen.getByTestId("page1-type")).toHaveTextContent("Unknown");
        expect(screen.getByTestId("page2-type")).toHaveTextContent("BackCover");
      });
      // Click reset all
      const user = userEvent.setup();

      await user.click(screen.getByTestId("reset-all-btn"));
      // Types should be reset to original
      await waitFor(() => {
        expect(screen.getByTestId("page1-type")).toHaveTextContent("Story");
        expect(screen.getByTestId("page2-type")).toHaveTextContent(
          "FrontCover",
        );
      });
    });
  });

  describe("PageSettingsContext saveAllSettings translation", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Ensure useComicInfo is always mocked
      mockUseComicInfo.mockReturnValue({
        parsedComicInfo: {},
        loading: false,
        error: null,
        reloadComicInfo: jest.fn(),
      });
      // Ensure useArchiveContext is mocked
      mockUseArchiveContext.mockReturnValue(createMockArchiveContext());
    });

    it("should translate currentSettings to backend type and pass Type: 'Story'", async () => {
      const mockStorage = createMockStorageManager();
      const currentSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": createBlankPageInfo(),
      };
      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        currentSettings,
      );
      mockedInvoke.mockResolvedValue(undefined);

      const TestComponent = () => {
        const { saveAllSettings, updatePageSettings } =
          usePageSettingsContext();
        const [updated, setUpdated] = React.useState(false);
        return (
          <div>
            <button
              onClick={() => {
                updatePageSettings("page1.jpg", {
                  Type: PageType.FrontCover,
                  DoublePage: false,
                  Bookmark: "",
                  IsEmpty: () => false,
                  Equals: () => false,
                });
                setUpdated(true);
              }}
              data-testid="update-btn"
            >
              Update
            </button>
            <button
              onClick={() => saveAllSettings()}
              data-testid="save-btn"
              disabled={!updated}
            >
              Save
            </button>
          </div>
        );
      };

      render(
        <PageSettingsProvider
          path="/tmp/comic.cbz"
          storageManager={mockStorage as any}
        >
          <TestComponent />
        </PageSettingsProvider>,
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("update-btn"));
      await user.click(screen.getByTestId("save-btn"));

      expect(mockedInvoke).toHaveBeenCalledWith(
        "save_page_settings",
        expect.objectContaining({
          path: "/tmp/comic.cbz",
          pageSettings: expect.objectContaining({
            "page1.jpg": expect.objectContaining({
              Type: PageType.FrontCover,
            }),
          }),
        }),
      );
    });
  });

  describe("Page Deletion Scenario (Clearing Settings)", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockUseComicInfo.mockReturnValue({
        parsedComicInfo: {},
        loading: false,
        error: null,
        reloadComicInfo: jest.fn(),
      });
    });

    it("should not send empty pages to backend when user clears page settings", async () => {
      const mockStorage = createMockStorageManager();

      // Original settings: page1 has Story type and bookmark
      const originalSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": newPageInfo(PageType.Story, false, "Chapter 1"),
        "page2.jpg": newPageInfo(PageType.FrontCover, false, ""),
      };

      // Current settings: page1 has been cleared to empty, page2 remains unchanged
      const currentSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": createBlankPageInfo(), // Empty - IsEmpty() returns true
        "page2.jpg": newPageInfo(PageType.FrontCover, false, ""),
      };

      mockUseComicInfo.mockReturnValue({
        parsedComicInfo: originalSettings,
        loading: false,
        error: null,
        reloadComicInfo: jest.fn(),
      });

      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        currentSettings,
      );

      mockedInvoke.mockResolvedValue(undefined);

      const TestComponent = () => {
        const { currentSettings, updatePageSettings, saveAllSettings } =
          usePageSettingsContext();
        const [saveCompleted, setSaveCompleted] = useState(false);

        return (
          <div>
            <button
              onClick={() => {
                // User clears page1 settings
                updatePageSettings("page1.jpg", createBlankPageInfo());
              }}
              data-testid="clear-page1-btn"
            >
              Clear Page 1
            </button>
            <button
              onClick={async () => {
                await saveAllSettings();
                setSaveCompleted(true);
              }}
              data-testid="save-btn"
            >
              Save
            </button>
            <div data-testid="page1-empty">
              {currentSettings["page1.jpg"]?.IsEmpty().toString()}
            </div>
            <div data-testid="save-completed">{saveCompleted.toString()}</div>
          </div>
        );
      };

      render(
        <PageSettingsProvider
          path="/test/path.cbz"
          storageManager={mockStorage as any}
        >
          <TestComponent />
        </PageSettingsProvider>,
      );

      const user = userEvent.setup();

      // Verify initial state
      await waitFor(() => {
        expect(screen.getByTestId("page1-empty")).toHaveTextContent("true");
      });

      // Save the cleared settings
      await user.click(screen.getByTestId("save-btn"));

      // Backend should be called with only page2, page1 should NOT be in the settings
      expect(mockedInvoke).toHaveBeenCalledWith(
        "save_page_settings",
        expect.objectContaining({
          path: "/test/path.cbz",
          pageSettings: {
            "page2.jpg": expect.objectContaining({
              Type: PageType.FrontCover,
              Image: 1,
            }),
          },
        }),
      );

      // Ensure page1 is NOT in the sent settings
      const callArgs = mockedInvoke.mock.calls[0][1] as Record<
        string,
        Record<string, any>
      >;
      expect(callArgs.pageSettings).not.toHaveProperty("page1.jpg");

      await waitFor(() => {
        expect(screen.getByTestId("save-completed")).toHaveTextContent("true");
      });
    });

    it("should detect when page goes from edited non-empty to empty", async () => {
      const mockStorage = createMockStorageManager();

      const originalSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": newPageInfo(PageType.Story, false, "Original"),
      };

      const currentSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": createBlankPageInfo(),
      };

      mockUseComicInfo.mockReturnValue({
        parsedComicInfo: originalSettings,
        loading: false,
        error: null,
      });

      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        currentSettings,
      );

      const TestComponent = () => {
        const { isPageEdited } = usePageSettingsContext();

        return (
          <div>
            <div data-testid="is-edited">
              {isPageEdited("page1.jpg").toString()}
            </div>
          </div>
        );
      };

      render(
        <PageSettingsProvider
          path="/test/path.cbz"
          storageManager={mockStorage as any}
        >
          <TestComponent />
        </PageSettingsProvider>,
      );

      // Page should be marked as edited because it was originally non-empty but now is empty
      await waitFor(() => {
        expect(screen.getByTestId("is-edited")).toHaveTextContent("true");
      });
    });

    it("should filter out empty pages before sending to backend", async () => {
      const mockStorage = createMockStorageManager();

      const settings: Record<string, ComicPageInfo> = {
        "page1.jpg": createBlankPageInfo(),
        "page2.jpg": createBlankPageInfo(),
        "page3.jpg": newPageInfo(PageType.Story, false, "Keep this"),
      };

      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        settings,
      );

      mockedInvoke.mockResolvedValue(undefined);

      const TestComponent = () => {
        const { saveAllSettings } = usePageSettingsContext();

        return (
          <button onClick={() => saveAllSettings()} data-testid="save-btn">
            Save
          </button>
        );
      };

      render(
        <PageSettingsProvider
          path="/test/path.cbz"
          storageManager={mockStorage as any}
        >
          <TestComponent />
        </PageSettingsProvider>,
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("save-btn"));

      // Only page3 should be sent to backend
      const callArgs = mockedInvoke.mock.calls[0][1] as Record<
        string,
        Record<string, any>
      >;
      expect(Object.keys(callArgs.pageSettings)).toEqual(["page3.jpg"]);
      expect(callArgs.pageSettings["page3.jpg"]).toEqual(
        expect.objectContaining({
          Type: PageType.Story,
          Bookmark: "Keep this",
        }),
      );
    });

    it("should mark hasEditedPages as true when a page is cleared", async () => {
      const mockStorage = createMockStorageManager();

      const originalSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": newPageInfo(PageType.Story, false, "bookmark"),
        "page2.jpg": createBlankPageInfo(),
      };

      const editedSettings: Record<string, ComicPageInfo> = {
        "page1.jpg": createBlankPageInfo(), // Cleared
        "page2.jpg": createBlankPageInfo(),
      };

      mockUseComicInfo.mockReturnValue({
        parsedComicInfo: originalSettings,
        loading: false,
        error: null,
      });

      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        editedSettings,
      );

      const TestComponent = () => {
        const { hasEditedPages } = usePageSettingsContext();

        return <div data-testid="has-edited">{hasEditedPages.toString()}</div>;
      };

      render(
        <PageSettingsProvider
          path="/test/path.cbz"
          storageManager={mockStorage as any}
        >
          <TestComponent />
        </PageSettingsProvider>,
      );

      // Should have edited pages because page1 was cleared
      await waitFor(() => {
        expect(screen.getByTestId("has-edited")).toHaveTextContent("true");
      });
    });

    it("should treat bookmark with only whitespace as empty", async () => {
      const mockStorage = createMockStorageManager();

      const settings: Record<string, ComicPageInfo> = {
        "page1.jpg": newPageInfo(PageType.Unknown, false, "   "), // Whitespace only
        "page2.jpg": newPageInfo(PageType.Story, false, "keep"),
      };

      (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
        settings,
      );

      mockedInvoke.mockResolvedValue(undefined);

      const TestComponent = () => {
        const { saveAllSettings } = usePageSettingsContext();

        return (
          <button onClick={() => saveAllSettings()} data-testid="save-btn">
            Save
          </button>
        );
      };

      render(
        <PageSettingsProvider
          path="/test/path.cbz"
          storageManager={mockStorage as any}
        >
          <TestComponent />
        </PageSettingsProvider>,
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("save-btn"));

      // Only page2 should be sent (page1 has whitespace-only bookmark, should be filtered)
      const callArgs = mockedInvoke.mock.calls[0][1] as Record<
        string,
        Record<string, any>
      >;
      expect(Object.keys(callArgs.pageSettings)).toEqual(["page2.jpg"]);
      expect(callArgs.pageSettings).not.toHaveProperty("page1.jpg");
    });
  });
});
