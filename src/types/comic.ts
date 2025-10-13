import { ErrorResponse } from "./errorResponse";

export enum PageType {
  Unknown = "Unknown",
  Loading = "Loading",
  FrontCover = "FrontCover",
  InnerCover = "InnerCover",
  Roundup = "Roundup",
  Story = "Story",
  Advertisement = "Advertisement",
  Editorial = "Editorial",
  Letters = "Letters",
  Preview = "Preview",
  BackCover = "BackCover",
  Other = "Other",
  Deleted = "Deleted",
}

export interface ComicPageInfo {
  Equals(current: ComicPageInfo): boolean;
  IsEmpty(): boolean;
  Type: PageType;
  DoublePage: boolean;
  Bookmark: string;
}

export interface ComicInfo {
  Title?: string;
  Series?: string;
  Number?: string;
  Count?: number;
  Volume?: number;
  AlternateSeries?: string;
  AlternateNumber?: string;
  AlternateCount?: number;
  Summary?: string;
  Notes?: string;
  Year?: number;
  Month?: number;
  Day?: number;
  Writer?: string;
  Penciller?: string;
  Inker?: string;
  Colorist?: string;
  Letterer?: string;
  CoverArtist?: string;
  Editor?: string;
  Translator?: string;
  Publisher?: string;
  Imprint?: string;
  Genre?: string;
  Tags?: string;
  Web?: string;
  PageCount?: number;
  Pages?:
    | {
        Page: ComicInfoPage[];
      }
    | ComicInfoPage[];
}

export interface ComicInfoPage {
  Image?: number;
  Type?: string;
  DoublePage?: boolean;
  Bookmark?: string;
}

export interface LoadCbzResponse {
  image_files: string[];
  comic_info: ComicInfo | null;
  error: ErrorResponse | null;
}

export const isBookmarked = (
  pageInfo: ComicPageInfo | null | undefined,
): boolean => {
  if (!pageInfo) {
    return false;
  }

  return !!(pageInfo.Bookmark && pageInfo.Bookmark.trim() !== "");
};

function isPageInfoEmpty(pageInfo: ComicPageInfo): boolean {
  return (
    pageInfo.Type === PageType.Unknown &&
    !pageInfo.DoublePage &&
    !pageInfo.Bookmark
  );
}

function arePageInfoEqual(a: ComicPageInfo, b: ComicPageInfo): boolean {
  return (
    a.Type === b.Type &&
    a.DoublePage === b.DoublePage &&
    a.Bookmark === b.Bookmark
  );
}

export const newPageInfo = (
  type: PageType,
  doublePage: boolean = false,
  bookmark: string = "",
): ComicPageInfo => ({
  Type: type,
  DoublePage: doublePage,
  Bookmark: bookmark,
  IsEmpty(): boolean {
    return isPageInfoEmpty(this);
  },
  Equals(current: ComicPageInfo): boolean {
    return arePageInfoEqual(this, current);
  },
});

export const createBlankPageInfo = (): ComicPageInfo => ({
  Type: PageType.Unknown,
  DoublePage: false,
  Bookmark: "",
  IsEmpty(): boolean {
    return isPageInfoEmpty(this);
  },
  Equals(current: ComicPageInfo): boolean {
    return arePageInfoEqual(this, current);
  },
});

export const createLoadingPageInfo = (): ComicPageInfo => ({
  Type: PageType.Loading,
  DoublePage: false,
  Bookmark: "",
  IsEmpty(): boolean {
    return isPageInfoEmpty(this);
  },
  Equals(current: ComicPageInfo): boolean {
    return arePageInfoEqual(this, current);
  },
});

// Utility to convert string to PageType enum
export function toPageType(type: string | undefined): PageType {
  if (!type) return PageType.Unknown;

  if (type && Object.hasOwn(PageType, type)) {
    return PageType[type as keyof typeof PageType];
  }

  return PageType.Unknown;
}
