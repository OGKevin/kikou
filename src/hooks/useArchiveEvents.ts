import { useEffect, useRef } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { devLog } from "@/utils/devLog";

export type ArchiveEventHandlers = {
  onReload?: () => void;
  onCreated?: () => void;
};

export function useArchiveEvents(
  path: string | undefined,
  handlers: ArchiveEventHandlers,
) {
  const unlistenReloadRef = useRef<UnlistenFn | null>(null);
  const unlistenCreatedRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    if (unlistenReloadRef.current) {
      unlistenReloadRef.current();
      unlistenReloadRef.current = null;
    }

    if (unlistenCreatedRef.current) {
      unlistenCreatedRef.current();
      unlistenCreatedRef.current = null;
    }

    if (!path) return;

    let cancelled = false;

    (async () => {
      devLog("Subscribing to archive events for", path);

      try {
        const unlistenReload = await listen<string>(
          "reload-archive",
          (event) => {
            if (cancelled) return;

            if (!event.payload) return;

            if (event.payload === path) {
              handlers.onReload?.();
            }
          },
        );

        unlistenReloadRef.current = unlistenReload;

        const unlistenCreated = await listen<string>(
          "archive-created",
          (event) => {
            if (cancelled) return;

            if (!event.payload) return;

            if (event.payload === path) {
              handlers.onCreated?.();
            }
          },
        );

        unlistenCreatedRef.current = unlistenCreated;
      } catch (e) {
        devLog("Failed to subscribe to archive events: " + String(e));
      }
    })();

    return () => {
      cancelled = true;

      if (unlistenReloadRef.current) {
        devLog("Unlistening reload-archive for", path);
        unlistenReloadRef.current();
        unlistenReloadRef.current = null;
      }

      if (unlistenCreatedRef.current) {
        devLog("Unlistening archive-created for", path);
        unlistenCreatedRef.current();
        unlistenCreatedRef.current = null;
      }
    };
  }, [path, handlers]);
}
