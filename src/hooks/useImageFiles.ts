import { useState, useEffect, useMemo } from "react";
import { LoadCbzResponse } from "../types/comic";
import { useArchiveContext } from "@/contexts/ArchiveContext";

export function useImageFiles() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const archive = useArchiveContext();

  // Memoize the array to prevent new references
  const memoizedFiles = useMemo(() => files, [files]);

  useEffect(() => {
    if (!archive) {
      throw new Error("useImageFiles must be used within an ArchiveProvider");
    }

    if (archive.loading) {
      setLoading(true);
      return;
    }

    if (archive.result) {
      const result = archive.result as LoadCbzResponse;

      setFiles(result.image_files || []);
      setError(null);
      setLoading(false);
      return;
    }

    if (archive.error) {
      setFiles([]);
      setError(archive.error.message);
      setLoading(false);
      return;
    }

    // default
    setFiles([]);
    setLoading(false);
  }, [archive]);

  return {
    imageFiles: memoizedFiles,
    loading,
    error,
  };
}
