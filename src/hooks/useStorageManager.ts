import { useEffect, useState } from "react";
import { LocalStorageManager, setStorageManager } from "../utils/localStorage";

export function useStorageManager(
  currentFile: string | null,
): LocalStorageManager | null {
  const [storageManager, setStorageManagerState] =
    useState<LocalStorageManager | null>(null);

  useEffect(() => {
    if (!currentFile) {
      setStorageManagerState(null);
      return;
    }

    const manager = setStorageManager(currentFile);

    setStorageManagerState(manager);
  }, [currentFile]);

  return storageManager;
}
