import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { savePageSettings } from "@/api/savePageSettings";
import { ComicPageInfo, createBlankPageInfo } from "../types/comic";
import { LocalStorageManager } from "../utils/localStorage";
import { devLog } from "../utils/devLog";
import { useComicInfo } from "../hooks/useComicInfo";

interface PageSettingsContextType {
  currentSettings: Record<string, ComicPageInfo>;
  originalSettings: Record<string, ComicPageInfo>;
  isSaving: boolean;
  hasEditedPages: boolean;
  updatePageSettings: (
    fileName: string,
    updates: Partial<ComicPageInfo>,
  ) => void;
  resetPageSettings: (fileName: string) => void;
  resetAllPageSettings: () => void;
  saveAllSettings: () => Promise<string[]>;
  getBookmarkedFiles: () => string[];
  isPageEdited: (fileName: string) => boolean;
}

const PageSettingsContext = createContext<PageSettingsContextType | null>(null);

export function usePageSettingsContext(): PageSettingsContextType {
  const context = useContext(PageSettingsContext);

  if (!context) {
    throw new Error(
      "usePageSettingsContext must be used within a PageSettingsProvider",
    );
  }

  return context;
}

interface PageSettingsProviderProps {
  children: ReactNode;
  path: string | null;
  storageManager: LocalStorageManager | null;
}

export function PageSettingsProvider({
  children,
  path,
  storageManager,
}: PageSettingsProviderProps) {
  const [currentSettings, setCurrentSettings] = useState<
    Record<string, ComicPageInfo>
  >({});
  const [originalSettings, setOriginalSettings] = useState<
    Record<string, ComicPageInfo>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedFromStorage = useRef(false);

  const { parsedComicInfo } = useComicInfo();

  useEffect(() => {
    devLog(
      "PageSettingsProvider useEffect - storageManager:",
      !!storageManager,
    );

    if (storageManager) {
      const storedCurrent = storageManager.getCurrentPageSettings();

      devLog(
        "Loaded current page settings from localStorage:",
        storedCurrent,
        "keys:",
        Object.keys(storedCurrent),
      );

      setCurrentSettings(storedCurrent);
      hasLoadedFromStorage.current = true;

      return;
    }

    devLog("No storageManager - setting empty state");
    setCurrentSettings({});
    setOriginalSettings({});
    hasLoadedFromStorage.current = true;
  }, [storageManager]);

  useEffect(() => {
    if (storageManager && Object.keys(currentSettings).length > 0) {
      storageManager.setCurrentPageSettings(currentSettings);
      devLog("Persisted current page settings to localStorage");
    }
  }, [currentSettings, storageManager]);

  useEffect(() => {
    if (Object.keys(parsedComicInfo).length > 0) {
      setOriginalSettings(parsedComicInfo);

      // Only set currentSettings from parsedComicInfo if we have loaded from storage
      // and currentSettings is empty
      if (hasLoadedFromStorage.current) {
        setCurrentSettings((prevSettings) => {
          if (Object.keys(prevSettings).length === 0) {
            return parsedComicInfo;
          }

          return prevSettings;
        });
      }

      devLog("Set original settings from comic info:", parsedComicInfo);
    }
  }, [parsedComicInfo]);

  const updatePageSettings = useCallback(
    (fileName: string, updates: Partial<ComicPageInfo>) => {
      setCurrentSettings((prev) => {
        const currentPageSettings = prev[fileName] || createBlankPageInfo();
        const newSettings = { ...currentPageSettings, ...updates };

        const updatedSettings = {
          ...prev,
          [fileName]: newSettings,
        };

        devLog(`Updated page settings for ${fileName}:`, newSettings);
        return updatedSettings;
      });
    },
    [],
  );

  const resetPageSettings = useCallback(
    (fileName: string) => {
      const originalPageSettings = originalSettings[fileName];

      if (originalPageSettings) {
        setCurrentSettings((prev) => ({
          ...prev,
          [fileName]: { ...originalPageSettings },
        }));
        devLog(`Reset page settings for ${fileName} to original`);

        return;
      }

      setCurrentSettings((prev) => ({
        ...prev,
        [fileName]: createBlankPageInfo(),
      }));
      devLog(`Reset page settings for ${fileName} to blank`);
    },
    [originalSettings],
  );

  const resetAllPageSettings = useCallback(() => {
    setCurrentSettings((prev) => {
      const updated: Record<string, ComicPageInfo> = {};

      Object.keys(prev).forEach((fileName) => {
        updated[fileName] =
          originalSettings[fileName] !== undefined
            ? { ...originalSettings[fileName] }
            : createBlankPageInfo();
      });
      return updated;
    });

    devLog("Reset all page settings to original");
  }, [originalSettings]);

  const getBookmarkedFiles = useCallback((): string[] => {
    return Object.entries(currentSettings)
      .filter(
        ([, settings]) => settings.Bookmark && settings.Bookmark.trim() !== "",
      )
      .map(([fileName]) => fileName);
  }, [currentSettings]);

  const isPageEdited = useCallback(
    (fileName: string): boolean => {
      if (!fileName) return false;

      const current = currentSettings[fileName];
      const original = originalSettings[fileName];

      if (!current && !original) return false;

      if (!current) {
        return false;
      }

      if (!original) {
        return !current.IsEmpty();
      }

      if (
        original == undefined ||
        original === null ||
        original.Equals === undefined
      ) {
        devLog(
          "Original is undefined for",
          fileName,
          currentSettings,
          originalSettings,
        );
      }

      return !original.Equals(current);
    },
    [currentSettings, originalSettings],
  );

  const hasEditedPages = useMemo(
    () => Object.keys(currentSettings).some((file) => isPageEdited(file)),
    [currentSettings, isPageEdited],
  );

  const { reloadComicInfo } = useComicInfo();

  const saveAllSettings = useCallback(async (): Promise<string[]> => {
    if (!path) {
      throw new Error("No archive path available");
    }

    setIsSaving(true);

    try {
      const allFiles = Object.keys(currentSettings);

      const backendSettings: Record<
        string,
        { Type: string; DoublePage: boolean; Bookmark: string; Image: number }
      > = {};

      if (hasEditedPages) {
        allFiles.forEach((fileName) => {
          const pageSettings = currentSettings[fileName];
          const index = allFiles.indexOf(fileName);

          if (pageSettings.IsEmpty()) {
            devLog(`Filtering out empty page: ${fileName}`, pageSettings);
            return;
          }

          if (pageSettings.Type === "Unknown") {
            devLog(
              `WARNING: Attempting to save page with Unknown type: ${fileName}`,
              pageSettings,
            );
          }

          backendSettings[fileName] = {
            Type: pageSettings.Type,
            DoublePage: pageSettings.DoublePage,
            Bookmark: pageSettings.Bookmark,
            Image: index,
          };
        });

        devLog("Saving edited pages to backend:", backendSettings);

        await savePageSettings(path, backendSettings);
        // No need to setOriginalSettings here; reloadComicInfo will update originalSettings via useComicInfo
        // Reload comic info from backend so useComicInfo gets the latest state

        if (typeof reloadComicInfo !== "function") {
          throw new Error("reloadComicInfo is null");
        }

        await reloadComicInfo();
      } else {
        devLog("No edited pages to save");
      }

      const updatedBookmarks = getBookmarkedFiles();

      if (storageManager) {
        storageManager.setBookmarkedFiles(updatedBookmarks);
      }

      devLog("Settings saved successfully and original cache updated");
      return updatedBookmarks;
    } catch (error) {
      devLog("Failed to save settings:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [
    path,
    hasEditedPages,
    currentSettings,
    getBookmarkedFiles,
    storageManager,
  ]);

  const contextValue: PageSettingsContextType = {
    currentSettings,
    originalSettings,
    isSaving,
    hasEditedPages,
    updatePageSettings,
    resetPageSettings,
    resetAllPageSettings,
    saveAllSettings,
    getBookmarkedFiles,
    isPageEdited,
  };

  return (
    <PageSettingsContext.Provider value={contextValue}>
      {children}
    </PageSettingsContext.Provider>
  );
}
