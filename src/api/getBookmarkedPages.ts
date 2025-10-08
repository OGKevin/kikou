import { invoke } from "@tauri-apps/api/core";

export async function getBookmarkedPages(path: string): Promise<string[]> {
  return await invoke("get_bookmarked_pages", { path });
}
