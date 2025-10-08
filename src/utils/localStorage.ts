import { ComicPageInfo, newPageInfo, PageType } from "../types/comic";

export class LocalStorageManager {
  private fileName: string;

  constructor(fileName: string) {
    this.fileName = fileName;
  }

  private getKey(key: string): string {
    return `${this.fileName}:${key}`;
  }

  /**
   * Restore methods to ComicPageInfo objects after deserialization
   */
  private restoreComicPageInfoMethods(
    obj: Partial<ComicPageInfo>,
  ): ComicPageInfo {
    if (!obj || typeof obj !== "object") {
      throw new Error("Invalid ComicPageInfo object");
    }

    return newPageInfo(
      obj.Type || PageType.Unknown,
      obj.DoublePage || false,
      obj.Bookmark || "",
    );
  }

  /**
   * Restore methods to a record of ComicPageInfo objects
   */
  private restoreComicPageInfoRecord(
    record: Record<string, Partial<ComicPageInfo>>,
  ): Record<string, ComicPageInfo> {
    const result: Record<string, ComicPageInfo> = {};

    for (const [key, value] of Object.entries(record)) {
      if (value && typeof value === "object") {
        result[key] = this.restoreComicPageInfoMethods(value);
      }
    }

    return result;
  }

  /**
   * Update the filename for this manager instance
   */
  updateFileName(fileName: string): void {
    this.fileName = fileName;
  }

  /**
   * Get the current filename
   */
  getFileName(): string {
    return this.fileName;
  }

  // ToC File operations
  setTocFile(file: string): void {
    localStorage.setItem(this.getKey("tocFile"), file);
  }

  getTocFile(): string | null {
    return localStorage.getItem(this.getKey("tocFile"));
  }

  removeTocFile(): void {
    localStorage.removeItem(this.getKey("tocFile"));
  }

  // Filter state operations
  setShowFiltered(value: boolean): void {
    localStorage.setItem(this.getKey("fileListShowFiltered"), value.toString());
  }

  getShowFiltered(): boolean {
    const value = localStorage.getItem(this.getKey("fileListShowFiltered"));

    return value === "true";
  }

  setShowBookmarkFiltered(value: boolean): void {
    localStorage.setItem(
      this.getKey("fileListShowBookmarkFiltered"),
      value.toString(),
    );
  }

  getShowBookmarkFiltered(): boolean {
    const value = localStorage.getItem(
      this.getKey("fileListShowBookmarkFiltered"),
    );

    return value === "true";
  }

  // Page settings operations - separate storage for original and current
  setCurrentPageSettings(settings: Record<string, ComicPageInfo>): void {
    localStorage.setItem(
      this.getKey("currentPageSettings"),
      JSON.stringify(settings),
    );
  }

  getCurrentPageSettings(): Record<string, ComicPageInfo> {
    const value = localStorage.getItem(this.getKey("currentPageSettings"));

    if (!value) return {};

    try {
      const parsed = JSON.parse(value);

      return this.restoreComicPageInfoRecord(parsed);
    } catch {
      return {};
    }
  }

  setOriginalPageSettings(settings: Record<string, ComicPageInfo>): void {
    localStorage.setItem(
      this.getKey("originalPageSettings"),
      JSON.stringify(settings),
    );
  }

  getOriginalPageSettings(): Record<string, ComicPageInfo> {
    const value = localStorage.getItem(this.getKey("originalPageSettings"));

    if (!value) return {};

    try {
      const parsed = JSON.parse(value);

      return this.restoreComicPageInfoRecord(parsed);
    } catch {
      return {};
    }
  }

  // Legacy method for backward compatibility
  // Page settings operations
  setPageSettings(settings: Record<string, ComicPageInfo>): void {
    localStorage.setItem(this.getKey("pageSettings"), JSON.stringify(settings));
  }

  getPageSettings(): Record<string, ComicPageInfo> {
    const value = localStorage.getItem(this.getKey("pageSettings"));

    if (!value) return {};

    try {
      return JSON.parse(value) as Record<string, ComicPageInfo>;
    } catch {
      return {};
    }
  }

  // Bookmarked files operations
  setBookmarkedFiles(files: string[]): void {
    localStorage.setItem(this.getKey("bookmarkedFiles"), JSON.stringify(files));
  }

  getBookmarkedFiles(): string[] {
    const value = localStorage.getItem(this.getKey("bookmarkedFiles"));

    if (!value) return [];

    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  // Navigation state operations
  setSelectedFile(file: string): void {
    localStorage.setItem(this.getKey("selectedFile"), file);
  }

  getSelectedFile(): string | null {
    return localStorage.getItem(this.getKey("selectedFile"));
  }

  removeSelectedFile(): void {
    localStorage.removeItem(this.getKey("selectedFile"));
  }

  // Image files operations
  setImageFiles(files: string[]): void {
    localStorage.setItem(this.getKey("imageFiles"), JSON.stringify(files));
  }

  getImageFiles(): string[] | null {
    const value = localStorage.getItem(this.getKey("imageFiles"));

    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  // ComicInfo XML operations
  setComicInfoXml(xml: string | null): void {
    if (xml === null) {
      localStorage.removeItem(this.getKey("comicInfoXml"));

      return;
    }

    localStorage.setItem(this.getKey("comicInfoXml"), xml);
  }

  getComicInfoXml(): string | null | undefined {
    const value = localStorage.getItem(this.getKey("comicInfoXml"));

    return value;
  }

  // Clear all data for this file
  clearAll(): void {
    this.removeTocFile();
    localStorage.removeItem(this.getKey("fileListShowFiltered"));
    localStorage.removeItem(this.getKey("fileListShowBookmarkFiltered"));
    localStorage.removeItem(this.getKey("pageSettings"));
    localStorage.removeItem(this.getKey("bookmarkedFiles"));
    this.removeSelectedFile();
    localStorage.removeItem(this.getKey("imageFiles"));
    localStorage.removeItem(this.getKey("comicInfoXml"));
    // Note: previewCache is now memory-only, no localStorage cleanup needed
  }
}

// Global instance - should be updated when a new file is loaded
let globalStorageManager: LocalStorageManager | null = null;

export function getStorageManager(): LocalStorageManager | null {
  return globalStorageManager;
}

export function setStorageManager(fileName: string): LocalStorageManager {
  globalStorageManager = new LocalStorageManager(fileName);
  return globalStorageManager;
}

export function clearStorageManager(): void {
  globalStorageManager = null;
}
