import { useMemo } from "react";
import { devLog } from "../utils/devLog";
import { ComicPageInfo } from "../types/comic";
import { useComicInfo } from "@/hooks/useComicInfo";
import { useArchiveContext } from "@/contexts/ArchiveContext";

export function useBookmarkedFiles() {
  const { parsedComicInfo } = useComicInfo();
  const archive = useArchiveContext();
  const imageFiles = useMemo(
    () => archive?.result?.image_files ?? [],
    [archive?.result?.image_files],
  );

  const bookmarkedFiles = useMemo(() => {
    devLog("Extracting bookmarks from parsedComicInfo and imageFiles", {
      parsedComicInfo,
      imageFiles,
    });

    return Object.entries(parsedComicInfo).reduce<string[]>(
      (acc, [file, pageInfo]) => {
        if (
          pageInfo.Bookmark &&
          pageInfo.Bookmark.trim() !== "" &&
          imageFiles.includes(file)
        ) {
          acc.push(file);
        }
        return acc;
      },
      [],
    );
  }, [parsedComicInfo, imageFiles]);

  devLog("Extracted bookmarks", bookmarkedFiles);

  return bookmarkedFiles;
}
