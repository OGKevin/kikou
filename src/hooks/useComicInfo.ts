import { useState, useEffect } from "react";
import {
  ComicInfo,
  ComicPageInfo,
  ComicInfoPage,
  createBlankPageInfo,
  newPageInfo,
  PageType,
} from "../types/comic";
import { useArchiveContext } from "@/contexts/ArchiveContext";
import { devLog } from "@/utils/devLog";

function mapStringToPageType(type: string): PageType {
  switch (type) {
    case "Unknown":
      return PageType.Unknown;
    case "Loading":
      return PageType.Loading;
    case "FrontCover":
      return PageType.FrontCover;
    case "InnerCover":
      return PageType.InnerCover;
    case "Roundup":
      return PageType.Roundup;
    case "Story":
      return PageType.Story;
    case "Advertisement":
      return PageType.Advertisement;
    case "Editorial":
      return PageType.Editorial;
    case "Letters":
      return PageType.Letters;
    case "Preview":
      return PageType.Preview;
    case "BackCover":
      return PageType.BackCover;
    case "Other":
      return PageType.Other;
    case "Deleted":
      return PageType.Deleted;
    default:
      return PageType.Unknown;
  }
}

export function createPageStatesFromComicInfo(
  imageFiles: string[],
  comicInfo: ComicInfo | null,
): Record<string, ComicPageInfo> {
  const result: Record<string, ComicPageInfo> = {};

  let pages: ComicInfoPage[] = [];

  if (comicInfo?.Pages) {
    if (Array.isArray(comicInfo.Pages)) {
      pages = comicInfo.Pages;
    } else if (comicInfo.Pages.Page) {
      pages = comicInfo.Pages.Page;
    }
  }

  imageFiles.forEach((fileName, index) => {
    const page = pages.find((p) => (p.Image ?? p["@Image"]) === index);

    if (page) {
      const type = mapStringToPageType(
        (page.Type ?? page["@Type"]) || "Unknown",
      );
      const doublePage = (page.DoublePage ?? page["@DoublePage"]) || false;
      const bookmark = (page.Bookmark ?? page["@Bookmark"]) || "";

      result[fileName] = newPageInfo(type, doublePage, bookmark);
    } else {
      result[fileName] = createBlankPageInfo();
    }
  });

  return result;
}

export function useComicInfo() {
  const [parsedComicInfo, setParsedComicInfo] = useState<
    Record<string, ComicPageInfo>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const archive = useArchiveContext();

  useEffect(() => {
    devLog("useComicInfo: archive changed", {
      comicInfo: archive?.result?.comic_info,
      imageFiles: archive?.result?.image_files,
      loading: archive?.loading,
      error: archive?.error,
    });

    if (!archive) {
      setParsedComicInfo({});
      setLoading(false);
      return;
    }

    if (archive.loading) {
      setLoading(true);
      return;
    }

    if (archive.result) {
      const result = archive.result as {
        image_files: string[];
        comic_info: ComicInfo | null;
      };
      const parsed = createPageStatesFromComicInfo(
        result.image_files || [],
        result.comic_info || null,
      );

      setParsedComicInfo(parsed);
      setError(null);
      setLoading(false);
      return;
    }

    if (archive.error) {
      setParsedComicInfo({});
      setError(archive.error.message);
      setLoading(false);
      return;
    }

    // default
    setParsedComicInfo({});
    setLoading(false);
  }, [
    // archive?.result?.comic_info,
    // archive?.result?.image_files,
    // archive?.loading,
    // archive?.error,
    archive,
  ]);

  return { parsedComicInfo, loading, error };
}
