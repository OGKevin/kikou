import { useEffect, useCallback } from "react";
import { useBookCoverContext } from "@/contexts/BookCoverContext";
import { streamBookCovers, CoverStreamEvent } from "@/api/library";
import { devLog } from "@/utils/devLog";

export interface UseStreamBookCoversOptions {
    bookIds: number[];
    enabled?: boolean;
    onProgress?: (loaded: number, total: number) => void;
    onFinish?: () => void;
    onStart?: () => void;
}

function createDataUrl(base64Data: string): string {
    return `data:image/jpeg;base64,${base64Data}`;
}

export function useStreamBookCovers({
    bookIds,
    enabled = true,
    onProgress,
    onFinish,
    onStart,
}: UseStreamBookCoversOptions): { startStreaming: () => Promise<void> } {
    const { coverCache } = useBookCoverContext();

    const startStreaming = useCallback(async (): Promise<void> => {
        if (!enabled || bookIds.length === 0) return; const uncachedIds = bookIds.filter(
            (bookId) => !coverCache.current[bookId],
        );

        if (uncachedIds.length === 0) {
            devLog("All book covers already cached");
            onFinish?.();

            return;
        }

        devLog(`Streaming ${uncachedIds.length} book covers`);

        let loaded = bookIds.length - uncachedIds.length;
        const total = bookIds.length;

        try {
            await streamBookCovers(uncachedIds, (event: CoverStreamEvent) => {
                switch (event.event) {
                    case "started":
                        if (
                            event.data &&
                            typeof event.data === "object" &&
                            "total_books" in event.data
                        ) {
                            devLog(`Started streaming ${event.data.total_books} covers`);
                            onStart?.();
                        }
                        break;

                    case "cover": {
                        if (
                            event.data &&
                            typeof event.data === "object" &&
                            "book_id" in event.data &&
                            "data_base64" in event.data
                        ) {
                            const { book_id, data_base64 } = event.data;

                            coverCache.current[book_id] = createDataUrl(data_base64);
                            loaded++;

                            devLog(`Cached cover for book ${book_id} (${loaded}/${total})`);

                            onProgress?.(loaded, total);
                        }
                        break;
                    }

                    case "error":
                        if (
                            event.data &&
                            typeof event.data === "object" &&
                            "book_id" in event.data &&
                            "message" in event.data
                        ) {
                            devLog(
                                `Error loading cover for book ${event.data.book_id}: ${event.data.message}`,
                            );
                            loaded++;
                            onProgress?.(loaded, total);
                        }
                        break;

                    case "finished":
                        devLog("Cover streaming finished");
                        onFinish?.();
                        break;
                }
            });
        } catch (error) {
            devLog("Cover streaming error:", error);
        }
    }, [bookIds, enabled, coverCache, onProgress, onFinish, onStart]);

    useEffect(() => {
        startStreaming();
    }, [startStreaming]);

    return { startStreaming };
}
