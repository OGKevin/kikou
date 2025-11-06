import { useState, useEffect, useCallback, useRef } from "react";
import { Book } from "@/types/book";
import { libraryOpen, libraryGetAllBooks } from "@/api/library";
import { useStreamBookCovers } from "./useStreamBookCovers";

const LIBRARY_PATH_KEY = "kikou_library_path";

export interface UseLibraryReturn {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  libraryPath: string | null;
  openLibrary: (path: string) => Promise<void>;
  loadBooks: () => Promise<void>;
  isLibraryOpen: boolean;
}

export function useLibrary(): UseLibraryReturn {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryPath, setLibraryPath] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const autoLoadAttemptedRef = useRef(false);
  const isLibraryOpenRef = useRef(false);

  const bookIds = books.map((book) => book.id);

  useStreamBookCovers({
    bookIds,
    enabled: books.length > 0,
  });

  // Keep ref in sync with state
  useEffect(() => {
    isLibraryOpenRef.current = isLibraryOpen;
  }, [isLibraryOpen]);

  // Load library path from localStorage on mount
  useEffect(() => {
    const savedPath = localStorage.getItem(LIBRARY_PATH_KEY);

    if (savedPath) {
      setLibraryPath(savedPath);
    }
  }, []);

  // Open library when path is set
  const openLibrary = useCallback(async (path: string) => {
    // Mark that auto-load should not trigger for this manual open
    autoLoadAttemptedRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      const uri = `calibre://${path}`;

      await libraryOpen(uri);
      localStorage.setItem(LIBRARY_PATH_KEY, path);
      setLibraryPath(path);
      setIsLibraryOpen(true);

      isLibraryOpenRef.current = true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to open library";

      setError(errorMessage);
      setIsLibraryOpen(false);

      isLibraryOpenRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load books from open library
  const loadBooks = useCallback(async () => {
    if (!isLibraryOpenRef.current) {
      setError("No library opened");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const loadedBooks = await libraryGetAllBooks();

      setBooks(loadedBooks);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load books";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-load library and books when libraryPath is loaded from localStorage
  useEffect(() => {
    if (libraryPath && !autoLoadAttemptedRef.current) {
      autoLoadAttemptedRef.current = true;
      openLibrary(libraryPath).then(() => {
        // After opening, load books
        setTimeout(() => {
          loadBooks();
        }, 100);
      });
    }
  }, [libraryPath, openLibrary, loadBooks]);

  return {
    books,
    isLoading,
    error,
    libraryPath,
    openLibrary,
    loadBooks,
    isLibraryOpen,
  };
}
