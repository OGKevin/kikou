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

function checkCachedPreview(
  path: string | undefined,
  previewCache: React.RefObject<Record<string, string>>,
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
    setPreviewUrl(previewCache.current[fileName]);
    setLoadingPreview(null);
    return true;
  }

  return false;
}

async function fetchPreview(
  path: string | undefined,
  previewCache: React.RefObject<Record<string, string>>,
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

  if (previewCache.current) {
    previewCache.current[fileName] = dataUrl;
  }

  setPreviewUrl(dataUrl);
  setLoadingPreview(null);
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
        fileName,
        setPreviewUrl,
        setPreviewError,
        setLoadingPreview,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [ctx.path, fileName]);

  return {
    loadingPreview,
    loading: loadingPreview,
    error: previewError,
    previewUrl,
  };
}
