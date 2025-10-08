import { useArchiveContext } from "@/contexts/ArchiveContext";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import React from "react";
import { FileDataResponse, GetCBZFileData } from "@/api/getCbzFileData";
import { ErrorResponse, ErrorResponseType } from "@/types/errorResponse";

function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    case "png":
    default:
      return "image/png";
  }
}

function createDataUrl(data: number[], fileName: string): string {
  const uint8Array = new Uint8Array(data);
  const base64 = btoa(
    Array.from(uint8Array)
      .map((byte) => String.fromCharCode(byte))
      .join(""),
  );
  const mimeType = getMimeType(fileName);

  return `data:${mimeType};base64,${base64}`;
}

type SetString = Dispatch<SetStateAction<string | null>>;
type SetError = Dispatch<SetStateAction<ErrorResponse | null>>;

const MAX_CACHE_ITEMS = 10;

function checkCachedPreview(
  path: string | undefined,
  previewCache: React.MutableRefObject<Record<string, string>>,
  cacheAccessOrder: React.MutableRefObject<string[]>,
  fileName: string | null,
  setPreviewUrl: SetString,
  setLoadingPreview: SetString,
): boolean {
  if (!path || !fileName) {
    setLoadingPreview(null);
    setPreviewUrl(null);
    return true;
  }

  if (previewCache.current[fileName]) {
    const newAccessOrder = [
      fileName,
      ...cacheAccessOrder.current.filter((f) => f !== fileName),
    ];

    cacheAccessOrder.current = newAccessOrder;
    setPreviewUrl(previewCache.current[fileName]);
    setLoadingPreview(null);
    return true;
  }

  return false;
}

async function fetchPreview(
  path: string | undefined,
  previewCache: React.RefObject<Record<string, string>>,
  cacheAccessOrder: React.RefObject<string[]>,
  fileName: string,
  setPreviewUrl: SetString,
  setPreviewError: SetError,
  setLoadingPreview: SetString,
): Promise<void> {
  if (!path) {
    setPreviewError({
      error_type: ErrorResponseType.Other,
      message: "Archive path missing",
    });
    setLoadingPreview(null);
    return;
  }

  setLoadingPreview(fileName);
  setPreviewUrl(null);

  let res: FileDataResponse;

  try {
    res = await GetCBZFileData(path, fileName);
  } catch (err) {
    setPreviewError({
      error_type: ErrorResponseType.Other,
      message: err instanceof Error ? err.message : "Failed to load preview",
    });
    setLoadingPreview(null);
    return;
  }

  if (res.error) {
    setPreviewError(res.error);
    setLoadingPreview(null);
    return;
  }

  const data = res.data ?? null;

  if (!data) {
    setLoadingPreview(null);
    return;
  }

  const dataUrl = createDataUrl(data, fileName);

  updateCache(previewCache, cacheAccessOrder, fileName, dataUrl);

  setPreviewUrl(dataUrl);
  setLoadingPreview(null);
}

function updateCache(
  cache: React.RefObject<Record<string, string>>,
  accessOrder: React.RefObject<string[]>,
  fileName: string,
  dataUrl: string,
): void {
  const newAccessOrder = [
    fileName,
    ...accessOrder.current.filter((f) => f !== fileName),
  ];

  const newCache = { ...cache.current, [fileName]: dataUrl };
  let finalAccessOrder = newAccessOrder;

  if (finalAccessOrder.length > MAX_CACHE_ITEMS) {
    const filesToRemove = finalAccessOrder.slice(MAX_CACHE_ITEMS);

    for (const fileToRemove of filesToRemove) {
      delete newCache[fileToRemove];
    }

    finalAccessOrder = finalAccessOrder.slice(0, MAX_CACHE_ITEMS);
  }

  cache.current = newCache;
  accessOrder.current = finalAccessOrder;
}

export function usePreviewCache(fileName: string | null) {
  const ctx = useArchiveContext();

  if (!ctx) throw new Error("ArchiveContext not found");

  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<ErrorResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setPreviewError(null);

    if (
      checkCachedPreview(
        ctx.path,
        ctx.previewCache,
        ctx.cacheAccessOrder,
        fileName,
        setPreviewUrl,
        setLoadingPreview,
      )
    ) {
      return;
    }

    (async () => {
      if (cancelled || !fileName) return;

      await fetchPreview(
        ctx.path,
        ctx.previewCache,
        ctx.cacheAccessOrder,
        fileName,
        setPreviewUrl,
        setPreviewError,
        setLoadingPreview,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [ctx.path, ctx.previewCache, ctx.cacheAccessOrder, fileName]);

  return {
    loadingPreview,
    loading: loadingPreview,
    error: previewError,
    previewUrl,
  };
}
