import { useEffect } from "react";
import { devLog } from "../utils/devLog";
import { ComicInfo, ComicInfoPage } from "../types/comic";

export function useBookmarkedFiles(
  comicInfo: ComicInfo | null | undefined,
  imageFiles: string[],
  setBookmarkedFiles: (files: string[]) => void,
) {
  useEffect(() => {
    if (!comicInfo || !comicInfo.Pages) {
      setBookmarkedFiles([]);
      return;
    }

    devLog("Extracting bookmarks from comicInfo and imageFiles");

    // Normalize pages array
    const pagesArr: ComicInfoPage[] = Array.isArray(comicInfo.Pages)
      ? comicInfo.Pages
      : comicInfo.Pages.Page;

    // Sort image files as in Rust
    const sortedImageFiles = [...imageFiles].sort();

    // Only consider bookmarks for pages whose image filename is in sortedImageFiles
    const bookmarkedFiles = pagesArr
      .filter((page: ComicInfoPage) => {
        const hasBookmark = page.Bookmark && page.Bookmark.trim() !== "";
        const hasImage =
          page.Image !== undefined && sortedImageFiles[page.Image];

        return hasBookmark && hasImage;
      })
      .map((page: ComicInfoPage) => sortedImageFiles[page.Image!]);

    setBookmarkedFiles(bookmarkedFiles);
    devLog("Extracted bookmarks", bookmarkedFiles);
  }, [comicInfo, imageFiles, setBookmarkedFiles]);
}
