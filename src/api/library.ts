import { invoke, Channel } from "@tauri-apps/api/core";
import { Book } from "@/types/book";

export async function libraryOpen(uri: string): Promise<void> {
  return await invoke("library_open", { uri });
}

export async function libraryGetAllBooks(): Promise<Book[]> {
  return await invoke("library_get_all_books");
}

export async function libraryGetBook(bookId: number): Promise<Book> {
  return await invoke("library_get_book", { book_id: bookId });
}

export async function libraryGetBookCount(): Promise<number> {
  return await invoke("library_get_book_count");
}

export interface CoverStreamEvent {
  event: "started" | "cover" | "error" | "finished";
  data:
    | { total_books: number }
    | { book_id: number; data_base64: string }
    | { book_id: number; message: string }
    | null;
}

export async function streamBookCovers(
  bookIds: number[],
  onEvent: (event: CoverStreamEvent) => void,
): Promise<void> {
  const channel = new Channel<CoverStreamEvent>();

  channel.onmessage = onEvent;

  await invoke("library_stream_book_covers", {
    bookIds,
    onEvent: channel,
  });
}
