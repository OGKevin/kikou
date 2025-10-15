import { invoke, Channel } from "@tauri-apps/api/core";

export type StreamProgressEvent =
  | {
      event: "started";
      data: {
        total_files: number;
      };
    }
  | {
      event: "preview";
      data: {
        file_name: string;
        data_raw: number[];
        data_base64: string;
      };
    }
  | {
      event: "error";
      data: {
        file_name: string;
        message: string;
      };
    }
  | {
      event: "finished";
      data: null;
    };

export interface StreamFileDataOptions {
  path: string;
  fileNames: string[];
  onEvent: (event: StreamProgressEvent) => void;
}

export async function streamFileData({
  path,
  fileNames,
  onEvent,
}: StreamFileDataOptions): Promise<void> {
  const channel = new Channel<StreamProgressEvent>();

  channel.onmessage = (message) => {
    onEvent(message);
  };

  await invoke("stream_file_data", {
    path,
    fileNames,
    onEvent: channel,
  });
}
