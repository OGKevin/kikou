import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPanel from "../pages/SettingsPanel";
import {
  PageSettingsProvider,
  usePageSettingsContext,
} from "../../contexts/PageSettingsContext";
import {
  ArchiveProvider,
  useArchiveContext,
} from "../../contexts/ArchiveContext";
import { LocalStorageManager } from "../../utils/localStorage";
import {
  newPageInfo,
  PageType,
  ComicPageInfo,
  createBlankPageInfo,
} from "../../types/comic";

jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn(),
}));

jest.mock("../../contexts/ArchiveContext", () => ({
  useArchiveContext: jest.fn(),
  ArchiveProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockUseArchiveContext = useArchiveContext as jest.Mock;

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

// Test wrapper that provides the context and renders SettingsPanel
const TestWrapper = ({
  targetFile,
  initialCurrentSettings,
  initialOriginalSettings,
  archiveResult,
}: {
  targetFile: string | null;
  initialCurrentSettings?: Record<string, ComicPageInfo>;
  initialOriginalSettings?: Record<string, ComicPageInfo>;
  archiveResult?: any;
}) => {
  const mockStorage = createMockStorageManager();

  // Set up initial settings
  if (initialCurrentSettings) {
    (mockStorage.getCurrentPageSettings as jest.Mock).mockReturnValue(
      initialCurrentSettings,
    );
  }

  if (initialOriginalSettings) {
    (mockStorage.getOriginalPageSettings as jest.Mock).mockReturnValue(
      initialOriginalSettings,
    );
  }

  // Mock ArchiveContext
  mockUseArchiveContext.mockReturnValue({
    result: archiveResult || null,
    loading: false,
    error: null,
  });

  const TestConsumer = () => {
    const {
      currentSettings,
      updatePageSettings,
      resetPageSettings,
      isPageEdited,
    } = usePageSettingsContext();
    const fileSettings = targetFile
      ? currentSettings[targetFile] || createBlankPageInfo()
      : createBlankPageInfo();

    return (
      <>
        <div data-testid="is-edited">
          {targetFile ? isPageEdited(targetFile).toString() : ""}
        </div>
        <SettingsPanel
          targetFile={targetFile}
          currentSettings={fileSettings}
          onUpdateSettings={(updates) => {
            if (targetFile) {
              updatePageSettings(targetFile, updates);
            }
          }}
          onReset={() => {
            if (targetFile) {
              resetPageSettings(targetFile);
            }
          }}
        />
      </>
    );
  };

  return (
    <PageSettingsProvider
      path="/test/path.cbz"
      storageManager={mockStorage as any}
    >
      <ArchiveProvider>
        <TestConsumer />
      </ArchiveProvider>
    </PageSettingsProvider>
  );
};

describe("SettingsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows original settings panel when page is edited and hides it when reset", async () => {
    const user = userEvent.setup();

    const targetFile = "test-page.jpg";
    const initialCurrentSettings: Record<string, ComicPageInfo> = {
      [targetFile]: newPageInfo(PageType.Story, false, ""),
    };
    const initialOriginalSettings: Record<string, ComicPageInfo> = {
      [targetFile]: newPageInfo(PageType.Story, false, ""),
    };

    const archiveResult = {
      image_files: [targetFile],
      comic_info: {
        Pages: [{ Image: 0, Type: "Story", DoublePage: false, Bookmark: "" }],
      },
    };

    render(
      <TestWrapper
        targetFile={targetFile}
        initialCurrentSettings={initialCurrentSettings}
        initialOriginalSettings={initialOriginalSettings}
        archiveResult={archiveResult}
      />,
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Page Settings")).toBeInTheDocument();
    });

    // Initially, no original settings panel should be visible (no changes made)
    expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();

    // Make a change to the Type
    const typeButton = screen.getByRole("combobox", { name: /type/i });

    await user.click(typeButton);

    // Click on FrontCover option
    const frontCoverOption = screen.getByText("FrontCover");

    await user.click(frontCoverOption);

    // Now the original settings panel should appear
    await waitFor(() => {
      expect(screen.getByText("Original Settings")).toBeInTheDocument();
    });

    // Verify that both current and original sections exist
    const pageSettingsHeaders = screen.getAllByText("Page Settings");
    const originalSettingsHeaders = screen.getAllByText("Original Settings");

    expect(pageSettingsHeaders.length).toBe(1);
    expect(originalSettingsHeaders.length).toBe(1);

    // Reset the changes
    const resetButton = screen.getByText("Reset");

    await user.click(resetButton);

    // The original settings panel should disappear
    await waitFor(() => {
      expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();
    });

    // Only the main settings panel should remain
    expect(screen.getByText("Page Settings")).toBeInTheDocument();
  });

  it("shows original settings panel when bookmark is changed and hides it when reset", async () => {
    const user = userEvent.setup();

    const targetFile = "test-page.jpg";
    const initialCurrentSettings: Record<string, ComicPageInfo> = {
      [targetFile]: newPageInfo(PageType.Story, false, ""),
    };
    const initialOriginalSettings: Record<string, ComicPageInfo> = {
      [targetFile]: newPageInfo(PageType.Story, false, ""),
    };

    const archiveResult = {
      image_files: [targetFile],
      comic_info: {
        Pages: [{ Image: 0, Type: "Story", DoublePage: false, Bookmark: "" }],
      },
    };

    render(
      <TestWrapper
        targetFile={targetFile}
        initialCurrentSettings={initialCurrentSettings}
        initialOriginalSettings={initialOriginalSettings}
        archiveResult={archiveResult}
      />,
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Page Settings")).toBeInTheDocument();
    });

    // Initially, no original settings panel should be visible
    expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();

    // Make a change to the Bookmark
    const bookmarkInput = screen.getByPlaceholderText("Chapter title, etc.");

    await user.type(bookmarkInput, "Chapter 1");

    // Now the original settings panel should appear
    await waitFor(() => {
      expect(screen.getByText("Original Settings")).toBeInTheDocument();
    });

    // Reset the changes
    const resetButton = screen.getByText("Reset");

    await user.click(resetButton);

    // The original settings panel should disappear
    await waitFor(() => {
      expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();
    });
  });

  it("shows original settings panel when double page is changed and hides it when reset", async () => {
    const user = userEvent.setup();

    const targetFile = "test-page.jpg";
    const initialCurrentSettings: Record<string, ComicPageInfo> = {
      [targetFile]: newPageInfo(PageType.Story, false, ""),
    };
    const initialOriginalSettings: Record<string, ComicPageInfo> = {
      [targetFile]: newPageInfo(PageType.Story, false, ""),
    };

    const archiveResult = {
      image_files: [targetFile],
      comic_info: {
        Pages: [{ Image: 0, Type: "Story", DoublePage: false, Bookmark: "" }],
      },
    };

    render(
      <TestWrapper
        targetFile={targetFile}
        initialCurrentSettings={initialCurrentSettings}
        initialOriginalSettings={initialOriginalSettings}
        archiveResult={archiveResult}
      />,
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Page Settings")).toBeInTheDocument();
    });

    // Initially, no original settings panel should be visible
    expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();

    // Make a change to the DoublePage setting - find the button that shows "No"
    const doublePageButton = screen.getByRole("combobox", {
      name: /double page/i,
    });

    await user.click(doublePageButton);

    // Click on Yes option
    const yesOption = screen.getByText("Yes");

    await user.click(yesOption);

    // Now the original settings panel should appear
    await waitFor(() => {
      expect(screen.getByText("Original Settings")).toBeInTheDocument();
    });

    // Reset the changes
    const resetButton = screen.getByText("Reset");

    await user.click(resetButton);

    // The original settings panel should disappear
    await waitFor(() => {
      expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();
    });
  });

  it("manually reverting changes should hide original settings panel", async () => {
    const user = userEvent.setup();

    const targetFile = "test-page.jpg";
    const initialCurrentSettings: Record<string, ComicPageInfo> = {
      [targetFile]: newPageInfo(PageType.Story, false, ""),
    };
    const initialOriginalSettings: Record<string, ComicPageInfo> = {
      [targetFile]: newPageInfo(PageType.Story, false, ""),
    };

    const archiveResult = {
      image_files: [targetFile],
      comic_info: {
        Pages: [{ Image: 0, Type: "Story", DoublePage: false, Bookmark: "" }],
      },
    };

    render(
      <TestWrapper
        targetFile={targetFile}
        initialCurrentSettings={initialCurrentSettings}
        initialOriginalSettings={initialOriginalSettings}
        archiveResult={archiveResult}
      />,
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Page Settings")).toBeInTheDocument();
    });

    // Initially, no original settings panel should be visible
    expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();

    // Make a change to the Type
    const typeButton = screen.getByRole("combobox", { name: /type/i });

    await user.click(typeButton);

    // Click on FrontCover option
    const frontCoverOption = screen.getByText("FrontCover");

    await user.click(frontCoverOption);

    // Now the original settings panel should appear
    await waitFor(() => {
      expect(screen.getByText("Original Settings")).toBeInTheDocument();
    });

    // Manually revert the change back to Story - now there are two type selects, get the enabled one
    const typeButtons = screen.getAllByRole("combobox", { name: /type/i });
    const enabledTypeButton = typeButtons.find(
      (button) => !button.hasAttribute("disabled"),
    );

    if (enabledTypeButton) {
      await user.click(enabledTypeButton);

      // Click on Story option to revert - find the clickable story option
      const storyOptions = screen.getAllByText("Story");
      const clickableStoryOption = storyOptions.find((option) => {
        const listItem = option.closest("li");

        return listItem && listItem.getAttribute("role") === "option";
      });

      if (clickableStoryOption) {
        await user.click(clickableStoryOption);
      }
    }

    // The original settings panel should disappear
    await waitFor(() => {
      expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();
    });
  });

  it("shows correct original values in the original settings panel", async () => {
    const user = userEvent.setup();

    const targetFile = "test-page.jpg";
    const initialCurrentSettings: Record<string, ComicPageInfo> = {
      [targetFile]: newPageInfo(PageType.Story, false, "Original Bookmark"),
    };
    const initialOriginalSettings: Record<string, ComicPageInfo> = {
      [targetFile]: newPageInfo(PageType.Story, false, "Original Bookmark"),
    };

    const archiveResult = {
      image_files: [targetFile],
      comic_info: {
        Pages: [
          {
            Image: 0,
            Type: "Story",
            DoublePage: false,
            Bookmark: "Original Bookmark",
          },
        ],
      },
    };

    render(
      <TestWrapper
        targetFile={targetFile}
        initialCurrentSettings={initialCurrentSettings}
        initialOriginalSettings={initialOriginalSettings}
        archiveResult={archiveResult}
      />,
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Page Settings")).toBeInTheDocument();
    });

    // Make a change to the bookmark
    const bookmarkInput = screen.getByDisplayValue("Original Bookmark");

    await user.clear(bookmarkInput);
    await user.type(bookmarkInput, "Changed Bookmark");

    // Now the original settings panel should appear
    await waitFor(() => {
      expect(screen.getByText("Original Settings")).toBeInTheDocument();
    });

    // Verify the original settings show the correct values
    const originalSettingsSection = screen
      .getByText("Original Settings")
      .closest("div");

    expect(originalSettingsSection).toBeInTheDocument();

    // The original bookmark input should have the original value
    const originalBookmarkInputs =
      screen.getAllByDisplayValue("Original Bookmark");

    expect(originalBookmarkInputs.length).toBeGreaterThanOrEqual(1);

    // One should be disabled (the original one)
    const disabledOriginalInput = originalBookmarkInputs.find(
      (input) => (input as HTMLInputElement).disabled,
    );

    expect(disabledOriginalInput).toBeInTheDocument();
  });
});

describe("SettingsPanel Save functionality", () => {
  it("save button calls onSave when clicked", async () => {
    const user = userEvent.setup();
    const mockOnSave = jest.fn();
    const mockStorage = createMockStorageManager();

    const targetFile = "test-page.jpg";
    const bookmark = "Test bookmark";
    const currentSettings: ComicPageInfo = newPageInfo(
      PageType.Story,
      false,
      bookmark,
    );

    render(
      <PageSettingsProvider
        path="/test/path.cbz"
        storageManager={mockStorage as any}
      >
        <SettingsPanel
          targetFile={targetFile}
          currentSettings={currentSettings}
          onUpdateSettings={jest.fn()}
          onReset={jest.fn()}
          showSaveButton={true}
          onSave={mockOnSave}
          isSaving={false}
        />
      </PageSettingsProvider>,
    );

    const saveButton = screen.getByText("Save to Archive");

    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it("save button shows saving state and is disabled when isSaving is true", () => {
    const mockStorage = createMockStorageManager();

    const targetFile = "test-page.jpg";
    const bookmark = "Test bookmark";
    const currentSettings: ComicPageInfo = newPageInfo(
      PageType.Story,
      false,
      bookmark,
    );

    render(
      <PageSettingsProvider
        path="/test/path.cbz"
        storageManager={mockStorage as any}
      >
        <SettingsPanel
          targetFile={targetFile}
          currentSettings={currentSettings}
          onUpdateSettings={jest.fn()}
          onReset={jest.fn()}
          showSaveButton={true}
          onSave={jest.fn()}
          isSaving={true}
        />
      </PageSettingsProvider>,
    );

    const saveButton = screen.getByText("Saving...");

    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it("does not show save button when showSaveButton is false", () => {
    const mockStorage = createMockStorageManager();

    const targetFile = "test-page.jpg";
    const bookmark = "Test bookmark";
    const currentSettings: ComicPageInfo = newPageInfo(
      PageType.Story,
      false,
      bookmark,
    );

    render(
      <PageSettingsProvider
        path="/test/path.cbz"
        storageManager={mockStorage as any}
      >
        <SettingsPanel
          targetFile={targetFile}
          currentSettings={currentSettings}
          onUpdateSettings={jest.fn()}
          onReset={jest.fn()}
          showSaveButton={false}
          onSave={jest.fn()}
          isSaving={false}
        />
      </PageSettingsProvider>,
    );

    expect(screen.queryByText("Save to Archive")).not.toBeInTheDocument();
    expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
  });
});

describe("SettingsPanel edge cases", () => {
  it("does not show original settings panel and isPageEdited returns false when both current and original are empty objects", async () => {
    const targetFile = "02_page.png";

    render(
      <TestWrapper
        targetFile={targetFile}
        initialCurrentSettings={{}}
        initialOriginalSettings={{}}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Page Settings")).toBeInTheDocument();
    });
    expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();
    expect(screen.getByTestId("is-edited").textContent).toBe("false");
  });

  it("shows original settings panel when type is changed from Unknown, and hides it when reverted to Unknown", async () => {
    const user = userEvent.setup();
    const targetFile = "03_page.png";
    const initialCurrentSettings: Record<string, ComicPageInfo> = {
      [targetFile]: createBlankPageInfo(),
    };
    const initialOriginalSettings: Record<string, ComicPageInfo> = {
      [targetFile]: createBlankPageInfo(),
    };

    render(
      <TestWrapper
        targetFile={targetFile}
        initialCurrentSettings={initialCurrentSettings}
        initialOriginalSettings={initialOriginalSettings}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Page Settings")).toBeInTheDocument();
    });
    expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();
    expect(screen.getByTestId("is-edited").textContent).toBe("false");

    // Change type to Story
    const typeButton = screen.getByRole("combobox", { name: /type/i });

    await user.click(typeButton);
    const storyOption = screen.getByText("Story");

    await user.click(storyOption);
    await waitFor(() => {
      expect(screen.getByText("Original Settings")).toBeInTheDocument();
      expect(screen.getByTestId("is-edited").textContent).toBe("true");
    });

    // Change type back to Unknown - select the enabled combobox
    const typeButtons = screen.getAllByRole("combobox", { name: /type/i });
    const enabledTypeButton = typeButtons.find(
      (button) => !button.hasAttribute("disabled"),
    );

    await user.click(enabledTypeButton!);
    // Find the Unknown option in the dropdown (role=option)
    const unknownOptions = screen.getAllByText("Unknown");
    const clickableUnknownOption = unknownOptions.find((option) => {
      const listItem = option.closest("li");

      return listItem && listItem.getAttribute("role") === "option";
    });

    await user.click(clickableUnknownOption!);
    await waitFor(() => {
      expect(screen.queryByText("Original Settings")).not.toBeInTheDocument();
      expect(screen.getByTestId("is-edited").textContent).toBe("false");
    });
  });
});
