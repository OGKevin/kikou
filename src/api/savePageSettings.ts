import { invoke } from "@tauri-apps/api/core";

/**
 * The shape of the page settings sent to the backend.
 */
export interface BackendPageSettings {
  Type: string;
  DoublePage: boolean;
  Bookmark: string;
  Image: number;
}

/**
 * The shape of the response from the backend after saving.
 * This is an array of page settings, each with the same fields as above.
 */
export type SavePageSettingsResponse = BackendPageSettings[];

/**
 * Save page settings to the backend and get the new authoritative page settings.
 *
 * @param path - The archive path
 * @param pageSettings - The page settings to save, keyed by file name
 * @returns The new authoritative page settings as returned by the backend
 */
export async function savePageSettings(
  path: string,
  pageSettings: Record<string, BackendPageSettings>,
): Promise<SavePageSettingsResponse> {
  return invoke<SavePageSettingsResponse>("save_page_settings", {
    path,
    pageSettings,
  });
}
