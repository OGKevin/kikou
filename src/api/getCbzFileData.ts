import { invoke } from "@tauri-apps/api/core";
import { ErrorResponse } from "@/types/errorResponse";

export interface FileDataResponse {
  data: number[] | null;
  error: ErrorResponse | null;
}

export async function GetCBZFileData(
  path: string,
  fileName: string,
): Promise<FileDataResponse> {
  const res = await invoke<FileDataResponse>("get_cbz_file_data", {
    path,
    fileName,
  });

  return {
    data: res.data ?? null,
    error: res.error ?? null,
  };
}
