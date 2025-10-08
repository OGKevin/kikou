import { LocalStorageManager } from "../localStorage";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("LocalStorageManager", () => {
  let manager: LocalStorageManager;
  const testFileName = "test-comic.cbz";

  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
    manager = new LocalStorageManager(testFileName);
  });

  describe("constructor", () => {
    it("should create manager with filename prefix", () => {
      expect(manager.getFileName()).toBe(testFileName);
    });
  });

  describe("tocFile operations", () => {
    it("should set and get tocFile", () => {
      const tocFile = "page001.jpg";

      manager.setTocFile(tocFile);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `${testFileName}:tocFile`,
        tocFile,
      );
      expect(manager.getTocFile()).toBe(tocFile);
    });

    it("should return null for non-existent tocFile", () => {
      expect(manager.getTocFile()).toBeNull();
    });

    it("should remove tocFile", () => {
      manager.setTocFile("page001.jpg");
      manager.removeTocFile();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `${testFileName}:tocFile`,
      );
      expect(manager.getTocFile()).toBeNull();
    });
  });

  describe("filter state operations", () => {
    it("should set and get showFiltered state", () => {
      manager.setShowFiltered(true);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `${testFileName}:fileListShowFiltered`,
        "true",
      );
      expect(manager.getShowFiltered()).toBe(true);
    });

    it("should return false for non-existent showFiltered state", () => {
      expect(manager.getShowFiltered()).toBe(false);
    });

    it("should set and get showBookmarkFiltered state", () => {
      manager.setShowBookmarkFiltered(true);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `${testFileName}:fileListShowBookmarkFiltered`,
        "true",
      );
      expect(manager.getShowBookmarkFiltered()).toBe(true);
    });

    it("should return false for non-existent showBookmarkFiltered state", () => {
      expect(manager.getShowBookmarkFiltered()).toBe(false);
    });
  });

  describe("page settings operations", () => {
    it("should set and get page settings", () => {
      const settings = {
        "page001.jpg": { type: "Story", bookmark: "Chapter 1" },
      };

      manager.setPageSettings(settings);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `${testFileName}:pageSettings`,
        JSON.stringify(settings),
      );
      expect(manager.getPageSettings()).toEqual(settings);
    });

    it("should return empty object for non-existent page settings", () => {
      expect(manager.getPageSettings()).toEqual({});
    });

    it("should handle invalid JSON in page settings", () => {
      mockLocalStorage.getItem.mockReturnValueOnce("invalid-json");
      expect(manager.getPageSettings()).toEqual({});
    });
  });

  describe("bookmarked files operations", () => {
    it("should set and get bookmarked files", () => {
      const files = ["page001.jpg", "page005.jpg"];

      manager.setBookmarkedFiles(files);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `${testFileName}:bookmarkedFiles`,
        JSON.stringify(files),
      );
      expect(manager.getBookmarkedFiles()).toEqual(files);
    });

    it("should return empty array for non-existent bookmarked files", () => {
      expect(manager.getBookmarkedFiles()).toEqual([]);
    });

    it("should handle invalid JSON in bookmarked files", () => {
      mockLocalStorage.getItem.mockReturnValueOnce("invalid-json");
      expect(manager.getBookmarkedFiles()).toEqual([]);
    });
  });

  describe("navigation state operations", () => {
    it("should set and get selected file", () => {
      const file = "page001.jpg";

      manager.setSelectedFile(file);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `${testFileName}:selectedFile`,
        file,
      );
      expect(manager.getSelectedFile()).toBe(file);
    });

    it("should return null for non-existent selected file", () => {
      expect(manager.getSelectedFile()).toBeNull();
    });

    it("should remove selected file", () => {
      manager.setSelectedFile("page001.jpg");
      manager.removeSelectedFile();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `${testFileName}:selectedFile`,
      );
      expect(manager.getSelectedFile()).toBeNull();
    });
  });

  describe("clear operations", () => {
    it("should clear all data for current file", () => {
      manager.setTocFile("page001.jpg");
      manager.setShowFiltered(true);
      manager.setShowBookmarkFiltered(true);
      manager.setPageSettings({ "page001.jpg": { type: "Story" } });
      manager.setBookmarkedFiles(["page001.jpg"]);
      manager.setSelectedFile("page001.jpg");

      manager.clearAll();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `${testFileName}:tocFile`,
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `${testFileName}:fileListShowFiltered`,
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `${testFileName}:fileListShowBookmarkFiltered`,
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `${testFileName}:pageSettings`,
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `${testFileName}:bookmarkedFiles`,
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `${testFileName}:selectedFile`,
      );
    });
  });

  describe("ComicInfo XML operations", () => {
    it("should set and get ComicInfo XML", () => {
      const xml = "<?xml version='1.0'?><ComicInfo></ComicInfo>";

      manager.setComicInfoXml(xml);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `${testFileName}:comicInfoXml`,
        xml,
      );
      expect(manager.getComicInfoXml()).toBe(xml);
    });

    it("should handle null ComicInfo XML", () => {
      manager.setComicInfoXml(null);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `${testFileName}:comicInfoXml`,
      );
      expect(manager.getComicInfoXml()).toBeNull();
    });

    it("should return null for non-existent ComicInfo XML", () => {
      expect(manager.getComicInfoXml()).toBeNull();
    });
  });

  describe("filename updates", () => {
    it("should update filename and use new prefix", () => {
      const newFileName = "new-comic.cbz";

      manager.setTocFile("page001.jpg");

      manager.updateFileName(newFileName);

      expect(manager.getFileName()).toBe(newFileName);

      // New calls should use new prefix
      manager.setTocFile("page002.jpg");
      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
        `${newFileName}:tocFile`,
        "page002.jpg",
      );
    });
  });
});
