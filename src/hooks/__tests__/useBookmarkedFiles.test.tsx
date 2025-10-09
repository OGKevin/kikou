import { render } from "@testing-library/react";
import { useBookmarkedFiles } from "../useBookmarkedFiles";

jest.mock("@/hooks/useComicInfo");
jest.mock("@/contexts/ArchiveContext");

function TestComponent({
  onBookmarked,
}: {
  onBookmarked: (files: string[]) => void;
}) {
  const result = useBookmarkedFiles();
  onBookmarked(result);
  return null;
}

describe("useBookmarkedFiles", () => {
  const mockUseComicInfo = require("@/hooks/useComicInfo").useComicInfo;
  const mockUseArchiveContext =
    require("@/contexts/ArchiveContext").useArchiveContext;

  it("should call setBookmarkedFiles with empty array when no comicInfo", () => {
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      result: { image_files: ["a.jpg"] },
    });
    let result: string[] = [];
    const setBookmarkedFiles = (files: string[]) => {
      result = files;
    };
    render(<TestComponent onBookmarked={setBookmarkedFiles} />);
    expect(result).toEqual([]);
  });

  it("should only return bookmarks for pages with valid image index", () => {
    // Simulate parsedComicInfo as { file: ComicPageInfo }
    mockUseComicInfo.mockReturnValue({
      parsedComicInfo: {
        "imgA.jpg": { Bookmark: "bm1" },
        "imgB.jpg": { Bookmark: "bm2" },
        "imgC.jpg": { Bookmark: "" },
        "imgD.jpg": {},
        "imgE.jpg": { Bookmark: "bm3" },
      },
    });
    mockUseArchiveContext.mockReturnValue({
      result: {
        image_files: [
          "imgA.jpg",
          "imgB.jpg",
          "imgC.jpg",
          "imgD.jpg",
          "imgE.jpg",
        ],
      },
    });
    let result: string[] = [];
    const setBookmarkedFiles = (files: string[]) => {
      result = files;
    };
    render(<TestComponent onBookmarked={setBookmarkedFiles} />);
    expect(result).toEqual(["imgA.jpg", "imgB.jpg", "imgE.jpg"]);
  });

  it("should ignore bookmarks for pages with missing or invalid image index", () => {
    mockUseComicInfo.mockReturnValue({
      parsedComicInfo: {
        "imgA.jpg": { Bookmark: "bm3" },
        "imgB.jpg": { Bookmark: "bm1" }, // not in image_files
      },
    });
    mockUseArchiveContext.mockReturnValue({
      result: { image_files: ["imgA.jpg"] },
    });
    let result: string[] = [];
    const setBookmarkedFiles = (files: string[]) => {
      result = files;
    };
    render(<TestComponent onBookmarked={setBookmarkedFiles} />);
    expect(result).toEqual(["imgA.jpg"]);
  });

  it("should return empty array if no bookmarks", () => {
    mockUseComicInfo.mockReturnValue({
      parsedComicInfo: {
        "imgA.jpg": { Bookmark: "" },
        "imgB.jpg": {},
        "imgC.jpg": { Bookmark: "   " },
      },
    });
    mockUseArchiveContext.mockReturnValue({
      result: { image_files: ["imgA.jpg", "imgB.jpg", "imgC.jpg"] },
    });
    let result: string[] = [];
    const setBookmarkedFiles = (files: string[]) => {
      result = files;
    };
    render(<TestComponent onBookmarked={setBookmarkedFiles} />);
    expect(result).toEqual([]);
  });
});
