import {
  PageType,
  isBookmarked,
  createBlankPageInfo,
  newPageInfo,
  toPageType,
} from "../comic";

describe("Comic Types Utilities", () => {
  describe("createBlankPageInfo", () => {
    it("should create blank page info with default values", () => {
      const blankPage = createBlankPageInfo();

      expect(blankPage.Type).toBe(PageType.Unknown);
      expect(blankPage.DoublePage).toBe(false);
      expect(blankPage.Bookmark).toBe("");
      expect(typeof blankPage.IsEmpty).toBe("function");
      expect(typeof blankPage.Equals).toBe("function");
    });
  });

  describe("isBookmarked", () => {
    it("should return false for null or undefined", () => {
      expect(isBookmarked(null)).toBe(false);
      expect(isBookmarked(undefined)).toBe(false);
    });

    it("should handle ComicPageInfo format", () => {
      const bookmarkedPageInfo = newPageInfo(
        PageType.Story,
        false,
        "Bookmark text",
      );

      const storyPageInfo = newPageInfo(PageType.Story, false, "");

      expect(isBookmarked(storyPageInfo)).toBe(false);
      expect(isBookmarked(bookmarkedPageInfo)).toBe(true);
    });
  });

  describe("toPageType", () => {
    it("returns Unknown for undefined", () => {
      expect(toPageType(undefined)).toBe(PageType.Unknown);
    });

    it("returns Unknown for invalid string", () => {
      expect(toPageType("NotAType")).toBe(PageType.Unknown);
    });

    it("returns correct PageType for valid string", () => {
      expect(toPageType("Story")).toBe(PageType.Story);
      expect(toPageType("Unknown")).toBe(PageType.Unknown);
    });

    it("is case sensitive", () => {
      expect(toPageType("story")).toBe(PageType.Unknown);
    });
  });
});
