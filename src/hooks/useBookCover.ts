import { useState, useEffect } from "react";
import { useBookCoverContext } from "@/contexts/BookCoverContext";

export interface UseBookCoverResult {
  coverUrl: string | null;
  loading: boolean;
  error: string | null;
}

export function useBookCover(bookId: number | null): UseBookCoverResult {
  const { coverCache } = useBookCoverContext();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookId === null) {
      setCoverUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (coverCache.current[bookId]) {
      setCoverUrl(coverCache.current[bookId]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const checkInterval = setInterval(() => {
      if (coverCache.current[bookId]) {
        setCoverUrl(coverCache.current[bookId]);
        setLoading(false);
        clearInterval(checkInterval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      if (!coverCache.current[bookId]) {
        setError("Cover not available");
        setLoading(false);
        clearInterval(checkInterval);
      }
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [bookId, coverCache]);

  return { coverUrl, loading, error };
}
