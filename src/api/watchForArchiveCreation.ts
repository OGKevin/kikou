import { invoke } from "@tauri-apps/api/core";

export async function watchForArchiveCreation(path: string): Promise<void> {
  await invoke("watch_for_creation", { path });
}
