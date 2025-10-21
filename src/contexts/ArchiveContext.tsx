import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { LoadCbzResponse } from "@/types/comic";
import { devLog } from "@/utils/devLog";
import { ErrorResponse, ErrorResponseType } from "@/types/errorResponse";
import { useArchiveEvents } from "@/hooks/useArchiveEvents";
import { getStorageManager } from "@/utils/localStorage";

type ArchiveContextValue = {
  path?: string | undefined;
  result: LoadCbzResponse | null;
  loading: boolean;
  error: ErrorResponse | null;
  reload: () => void;
  reloadComicInfo: () => Promise<void>;
  previewCache: React.RefObject<Record<string, string>>;
  tocFile: string | null;
  setTocFile: React.Dispatch<React.SetStateAction<string | null>>;
  hasUnsavedXmlChanges: boolean;
  setHasUnsavedXmlChanges: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPage: number;
  setSelectedPage: React.Dispatch<React.SetStateAction<number>>;
};

const ArchiveContext = createContext<ArchiveContextValue | undefined>(
  undefined,
);

export function ArchiveProvider({
  path,
  children,
}: {
  path?: string;
  children: React.ReactNode;
}) {
  const [result, setResult] = useState<LoadCbzResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const previewCache = useRef<Record<string, string>>({});
  const [tocFile, setTocFile] = useState<string | null>(null);
  const [hasUnsavedXmlChanges, setHasUnsavedXmlChanges] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number>(0);

  const imageFiles = useMemo(
    () => result?.image_files ?? [],
    [result?.image_files],
  );

  // keep selectedPage within bounds when imageFiles change
  useEffect(() => {
    setSelectedPage((p) => {
      if (!imageFiles || imageFiles.length === 0) return 0;

      return Math.max(0, Math.min(p, imageFiles.length - 1));
    });
  }, [imageFiles]);

  const load = useCallback(async () => {
    if (!path) return;

    setLoading(true);
    setError(null);

    try {
      const res: LoadCbzResponse = await invoke("load_cbz", { path });

      devLog("ArchiveProvider load_cbz result:", res);

      if (res && res.error) {
        setError(res.error as ErrorResponse);
        setResult(res);
      } else {
        setResult(res);
        setError(null);
      }
    } catch (err) {
      setError({
        error_type: ErrorResponseType.Other,
        message: err instanceof Error ? err.message : "Failed to load archive",
      });
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [path]);

  const reload = useCallback(() => {
    devLog("ArchiveContext: reload called");
    load();
  }, [load]);

  const reloadComicInfo = useCallback(async () => {
    if (!path) return;
    try {
      const comicInfo: any = await invoke("get_comicinfo", { path });
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comic_info: comicInfo,
        };
      });
    } catch (err) {
      devLog("ArchiveContext: reloadComicInfo error", err);
    }
  }, [path]);

  useEffect(() => {
    if (!path) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }

    load();

    return () => {
      // Unload backend watcher when this provider is no longer active
      if (path) {
        invoke("unload_cbz", { path }).catch((err) => {
          devLog("Failed to unload CBZ watcher: " + String(err));
        });
      }
    };
  }, [path, load]);

  // Subscribe to Tauri events and reload directly
  const onReload = useCallback(() => {
    devLog("ArchiveContext: reload-archive event received", path);
    load();
  }, [path, load]);

  const onCreated = useCallback(() => {
    devLog("ArchiveContext: archive-created event received", path);
    load();
  }, [path, load]);

  useArchiveEvents(path, {
    onReload,
    onCreated,
  });

  useEffect(() => {
    // Reset in-memory cache when filePath changes - no eviction needed
    // Cache is only invalidated when archive changes or unmounts
    previewCache.current = {};
    setHasUnsavedXmlChanges(false); // Reset unsaved changes when switching files
    const manager = path ? getStorageManager() : null;

    setTocFile(manager ? manager.getTocFile() : null);
  }, [path]);

  return (
    <ArchiveContext.Provider
      value={{
        path,
        result,
        loading,
        error,
        reload,
        reloadComicInfo,
        previewCache,
        tocFile,
        setTocFile,
        hasUnsavedXmlChanges,
        setHasUnsavedXmlChanges,
        selectedPage,
        setSelectedPage,
      }}
    >
      {children}
    </ArchiveContext.Provider>
  );
}

export function useArchiveContext() {
  return useContext(ArchiveContext);
}
