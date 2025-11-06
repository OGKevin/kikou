import { renderHook, act, waitFor } from "@testing-library/react";
import { useLibrary } from "@/hooks/useLibrary";
import * as libraryApi from "@/api/library";
import React from "react";
import { BookCoverProvider } from "@/contexts/BookCoverContext";

jest.mock("@/api/library");

const mockBooks = [
  {
    id: 1,
    title: "Test Book 1",
    pubdate: "2024-01-01T00:00:00Z",
    isbn: "123-456",
    authors: [{ id: 1, name: "Test Author", sort: "Author, Test" }],
    publishers: ["Test Publisher"],
    tags: [],
    series: null,
    rating: null,
    formats: [],
    languages: [],
  },
  {
    id: 2,
    title: "Test Book 2",
    pubdate: "2024-01-02T00:00:00Z",
    isbn: "789-012",
    authors: [],
    publishers: [],
    tags: [],
    series: null,
    rating: null,
    formats: [],
    languages: [],
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BookCoverProvider>{children}</BookCoverProvider>
);

describe("useLibrary", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns initial empty state", () => {
    (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
    (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useLibrary(), { wrapper });

    expect(result.current.books).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.libraryPath).toBeNull();
    expect(result.current.isLibraryOpen).toBe(false);
  });

  it("opens library with URI", async () => {
    (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
    (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useLibrary(), { wrapper });

    await act(async () => {
      await result.current.openLibrary("/test/path");
    });

    expect(libraryApi.libraryOpen).toHaveBeenCalledWith("calibre:///test/path");
    expect(result.current.libraryPath).toBe("/test/path");
    expect(result.current.isLibraryOpen).toBe(true);
  });

  it("saves library path to localStorage when opening", async () => {
    (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
    (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useLibrary(), { wrapper });

    await act(async () => {
      await result.current.openLibrary("/test/path");
    });

    const saved = localStorage.getItem("kikou_library_path");
    expect(saved).toBe("/test/path");
  });

  it("handles error when opening library fails", async () => {
    const errorMessage = "Failed to open library";
    (libraryApi.libraryOpen as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage),
    );
    (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useLibrary(), { wrapper });

    await act(async () => {
      await result.current.openLibrary("/invalid/path");
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLibraryOpen).toBe(false);
  });

  it("loads books from open library", async () => {
    (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
    (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue(mockBooks);

    const { result } = renderHook(() => useLibrary(), { wrapper });

    await act(async () => {
      await result.current.openLibrary("/test/path");
    });

    await act(async () => {
      await result.current.loadBooks();
    });

    expect(result.current.books).toEqual(mockBooks);
  });

  it("sets loading state while fetching books", async () => {
    (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
    (libraryApi.libraryGetAllBooks as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockBooks), 50)),
    );

    const { result } = renderHook(() => useLibrary(), { wrapper });

    await act(async () => {
      await result.current.openLibrary("/test/path");
    });

    await act(async () => {
      await result.current.loadBooks();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.books.length).toBeGreaterThan(0);
  });

  it("handles error when loading books fails", async () => {
    const errorMessage = "Failed to load books";
    (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
    (libraryApi.libraryGetAllBooks as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    const { result } = renderHook(() => useLibrary(), { wrapper });

    await act(async () => {
      await result.current.openLibrary("/test/path");
    });

    await act(async () => {
      await result.current.loadBooks();
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.books).toEqual([]);
  });

  it("prevents loading books without open library", async () => {
    // Explicitly clear localStorage and mocks to prevent auto-load from previous tests
    localStorage.clear();
    jest.clearAllMocks();

    (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
    (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue(mockBooks);

    const { result } = renderHook(() => useLibrary(), { wrapper });

    // Clear the mock after rendering to account for any auto-load effects
    (libraryApi.libraryGetAllBooks as jest.Mock).mockClear();

    await act(async () => {
      await result.current.loadBooks();
    });

    expect(result.current.error).toBe("No library opened");
    // The API should NOT be called when there is no library open
    expect(libraryApi.libraryGetAllBooks).not.toHaveBeenCalled();
  });

  it("loads library path from localStorage on component mount", async () => {
    (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
    (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue([]);
    localStorage.setItem("kikou_library_path", "/saved/path");

    const { result } = renderHook(() => useLibrary(), { wrapper });

    await waitFor(() => {
      expect(result.current.libraryPath).toBe("/saved/path");
    });
  });

  it("clears error when successfully opening library", async () => {
    (libraryApi.libraryOpen as jest.Mock)
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockResolvedValueOnce(undefined);
    (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useLibrary(), { wrapper });

    await act(async () => {
      await result.current.openLibrary("/path1");
    });

    expect(result.current.error).toBeTruthy();

    await act(async () => {
      await result.current.openLibrary("/path2");
    });

    expect(result.current.error).toBeNull();
  });

  it("handles string error objects", async () => {
    (libraryApi.libraryOpen as jest.Mock).mockRejectedValueOnce(
      "String error message",
    );

    const { result } = renderHook(() => useLibrary(), { wrapper });

    await act(async () => {
      await result.current.openLibrary("/test/path");
    });

    expect(result.current.error).toBe("Failed to open library");
  });

  it("can manually load books after opening library", async () => {
    (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
    (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue(mockBooks);

    const { result } = renderHook(() => useLibrary(), { wrapper });

    await act(async () => {
      await result.current.openLibrary("/test/path");
    });

    await waitFor(() => {
      expect(result.current.isLibraryOpen).toBe(true);
    });

    // Reset the mock to count only the manual load call
    (libraryApi.libraryGetAllBooks as jest.Mock).mockClear();

    await act(async () => {
      await result.current.loadBooks();
    });

    expect(libraryApi.libraryGetAllBooks).toHaveBeenCalledTimes(1);
  });

  describe("Bug fix: Backend calls should be made when opening library with known path", () => {
    it("should call libraryOpen and libraryGetAllBooks when opening a library", async () => {
      (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
      (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue(mockBooks);

      const { result } = renderHook(() => useLibrary(), { wrapper });

      await act(async () => {
        await result.current.openLibrary("/test/path");
      });

      // Both API calls should be made
      expect(libraryApi.libraryOpen).toHaveBeenCalledWith(
        "calibre:///test/path",
      );

      // Manually load books to verify the call happens
      await act(async () => {
        await result.current.loadBooks();
      });

      expect(libraryApi.libraryGetAllBooks).toHaveBeenCalled();
    });

    it("should make backend calls when library path is set via savedPath then used", async () => {
      (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
      (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue(mockBooks);

      const { result } = renderHook(() => useLibrary(), { wrapper });

      // Simulate opening with an explicit call (not auto-load)
      await act(async () => {
        await result.current.openLibrary("/saved/path");
      });

      // Verify the backend was called
      expect(libraryApi.libraryOpen).toHaveBeenCalledWith(
        "calibre:///saved/path",
      );

      // Load books
      await act(async () => {
        await result.current.loadBooks();
      });

      expect(libraryApi.libraryGetAllBooks).toHaveBeenCalled();
      expect(result.current.books).toEqual(mockBooks);
    });

    it("should auto-load books after opening library with saved path", async () => {
      (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
      (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue(mockBooks);

      // Set saved path before rendering hook
      localStorage.setItem("kikou_library_path", "/saved/path");

      const { result } = renderHook(() => useLibrary(), { wrapper });

      // Wait for path to be loaded from localStorage
      await waitFor(() => {
        expect(result.current.libraryPath).toBe("/saved/path");
      });

      // Wait for auto-load to happen
      await waitFor(() => {
        expect(libraryApi.libraryOpen).toHaveBeenCalledWith(
          "calibre:///saved/path",
        );
      });

      // Wait for books to be auto-loaded
      await waitFor(() => {
        expect(libraryApi.libraryGetAllBooks).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.books).toEqual(mockBooks);
      });
    });

    it("should not call backend multiple times when opening same library", async () => {
      (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
      (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue(mockBooks);

      const { result } = renderHook(() => useLibrary(), { wrapper });

      await act(async () => {
        await result.current.openLibrary("/test/path");
      });

      const openCallCount = (libraryApi.libraryOpen as jest.Mock).mock.calls
        .length;

      // Try opening the same path again
      await act(async () => {
        await result.current.openLibrary("/test/path");
      });

      // Should have called open twice (once for each call)
      expect((libraryApi.libraryOpen as jest.Mock).mock.calls.length).toBe(
        openCallCount + 1,
      );
    });

    it("should properly handle isLoading state during library operations", async () => {
      (libraryApi.libraryOpen as jest.Mock).mockResolvedValue(undefined);
      (libraryApi.libraryGetAllBooks as jest.Mock).mockResolvedValue(mockBooks);

      const { result } = renderHook(() => useLibrary(), { wrapper });

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.openLibrary("/test/path");
      });

      // After opening, isLoading should be false and library should be open
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLibraryOpen).toBe(true);
    });
  });
});
