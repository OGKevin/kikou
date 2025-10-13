import { useMemo } from "react";
import { devLog } from "../utils/devLog";
import { useComicInfo } from "@/hooks/useComicInfo";
import { useArchiveContext } from "@/contexts/ArchiveContext";

export function useBookmarkedFiles() {
  const { parsedComicInfo } = useComicInfo();
  const archive = useArchiveContext();
  const imageFiles = useMemo(
    () => archive?.result?.image_files ?? [],
    [archive?.result?.image_files],
  );

  const imageFilesSet = useMemo(() => new Set(imageFiles), [imageFiles]);

  const bookmarkedFiles = useMemo(() => {
    devLog("Extracting bookmarks from parsedComicInfo and imageFiles", {
      parsedComicInfo,
      imageFilesSet,
    });

    return Object.entries(parsedComicInfo).reduce<string[]>(
      (acc, [file, pageInfo]) => {
        if (
          pageInfo.Bookmark &&
          pageInfo.Bookmark.trim() !== "" &&
          imageFilesSet.has(file)
        ) {
          acc.push(file);
        }

        return acc;
      },
      [],
    );
  }, [parsedComicInfo, imageFilesSet]);

  devLog("Extracted bookmarks", bookmarkedFiles);

  return bookmarkedFiles;
}
