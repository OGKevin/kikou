import { render } from "@testing-library/react";
import { useBookmarkedFiles } from "../useBookmarkedFiles";
import { ComicInfo } from "../../types/comic";

function TestComponent({
  comicInfo,
  imageFiles,
  onBookmarked,
}: {
  comicInfo: ComicInfo | null;
  imageFiles: string[];
  onBookmarked: (files: string[]) => void;
}) {
  useBookmarkedFiles(comicInfo, imageFiles, onBookmarked);
  return null;
}

describe("useBookmarkedFiles", () => {
  it("should call setBookmarkedFiles with empty array when no comicInfo", () => {
    let result: string[] = [];
    const setBookmarkedFiles = (files: string[]) => {
      result = files;
    };

    render(
      <TestComponent
        comicInfo={null}
        imageFiles={["a.jpg"]}
        onBookmarked={setBookmarkedFiles}
      />,
    );
    expect(result).toEqual([]);
  });

  it("should only return bookmarks for pages with valid image index", () => {
    const comicInfo: ComicInfo = {
      Pages: [
        { Image: 0, Bookmark: "bm1" }, // valid
        { Image: 1, Bookmark: "bm2" }, // valid
        { Image: 2, Bookmark: "" }, // not bookmarked
        { Image: 3 }, // not bookmarked
        { Image: 4, Bookmark: "bm3" }, // valid
        { Bookmark: "bm4" }, // no image index
      ],
    };
    const imageFiles = [
      "imgA.jpg",
      "imgB.jpg",
      "imgC.jpg",
      "imgD.jpg",
      "imgE.jpg",
    ];
    let result: string[] = [];
    const setBookmarkedFiles = (files: string[]) => {
      result = files;
    };

    render(
      <TestComponent
        comicInfo={comicInfo}
        imageFiles={imageFiles}
        onBookmarked={setBookmarkedFiles}
      />,
    );
    // Sorted image files: ["imgA.jpg", "imgB.jpg", "imgC.jpg", "imgD.jpg", "imgE.jpg"]
    expect(result).toEqual(["imgA.jpg", "imgB.jpg", "imgE.jpg"]);
  });

  it("should ignore bookmarks for pages with missing or invalid image index", () => {
    const comicInfo: ComicInfo = {
      Pages: [
        { Bookmark: "bm1" }, // no image index
        { Image: 10, Bookmark: "bm2" }, // out of bounds
        { Image: 0, Bookmark: "bm3" }, // valid
      ],
    };
    const imageFiles = ["imgA.jpg"];
    let result: string[] = [];
    const setBookmarkedFiles = (files: string[]) => {
      result = files;
    };

    render(
      <TestComponent
        comicInfo={comicInfo}
        imageFiles={imageFiles}
        onBookmarked={setBookmarkedFiles}
      />,
    );
    expect(result).toEqual(["imgA.jpg"]);
  });

  it("should return empty array if no bookmarks", () => {
    const comicInfo: ComicInfo = {
      Pages: [
        { Image: 0, Bookmark: "" },
        { Image: 1 },
        { Image: 2, Bookmark: "   " },
      ],
    };
    const imageFiles = ["imgA.jpg", "imgB.jpg", "imgC.jpg"];
    let result: string[] = [];
    const setBookmarkedFiles = (files: string[]) => {
      result = files;
    };

    render(
      <TestComponent
        comicInfo={comicInfo}
        imageFiles={imageFiles}
        onBookmarked={setBookmarkedFiles}
      />,
    );
    expect(result).toEqual([]);
  });
});
