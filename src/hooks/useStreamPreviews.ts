import { useEffect, useCallback } from "react";
import { useArchiveContext } from "@/contexts/ArchiveContext";
import { streamFileData, StreamProgressEvent } from "@/api/streamFileData";
import { devLog } from "@/utils/devLog";

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

function createDataUrl(base64Data: string, fileName: string): string {
  const mimeType = getMimeType(fileName);

  return `data:${mimeType};base64,${base64Data}`;
}

export interface UseStreamPreviewsOptions {
  fileNames: string[];
  enabled?: boolean;
  onProgress?: (loaded: number, total: number) => void;
  onFinish?: () => void;
  onStart?: () => void;
}

export function useStreamPreviews({
  fileNames,
  onProgress,
  onFinish,
  onStart,
}: UseStreamPreviewsOptions) {
  const ctx = useArchiveContext();

  if (!ctx) throw new Error("ArchiveContext not found");

  const startStreaming = useCallback(async () => {
    if (!ctx.path || fileNames.length === 0) return;

    const uncachedFiles = fileNames.filter(
      (fileName) => !ctx.previewCache.current[fileName],
    );

    if (uncachedFiles.length === 0) {
      devLog("All files already cached");
      onFinish?.();

      return;
    }

    devLog(`Streaming ${uncachedFiles.length} previews`);

    let loaded = fileNames.length - uncachedFiles.length;
    const total = fileNames.length;

    try {
      await streamFileData({
        path: ctx.path,
        fileNames: uncachedFiles,
        onEvent: (event: StreamProgressEvent) => {
          switch (event.event) {
            case "started":
              devLog(`Started streaming ${event.data.total_files} files`);

              onStart?.();

              break;
            case "preview": {
              const { file_name, data_base64 } = event.data;

              if (!file_name) {
                devLog("Received preview with undefined fileName", event);
                return;
              }

              ctx.previewCache.current[file_name] = createDataUrl(
                data_base64,
                file_name,
              );

              loaded++;

              devLog(`Cached preview for ${file_name} (${loaded}/${total})`);

              onProgress?.(loaded, total);
              break;
            }
            case "error":
              devLog(
                `Error loading ${event.data.file_name}: ${event.data.message}`,
              );
              loaded++;
              onProgress?.(loaded, total);
              break;
            case "finished":
              devLog("Streaming finished");

              onFinish?.();
              break;
          }
        },
      });
    } catch (error) {
      devLog("Streaming error:", error);
    }
  }, [ctx.path, fileNames, onProgress, onFinish, onStart]);

  useEffect(() => {
    startStreaming();
  }, [startStreaming]);

  return { startStreaming };
}
