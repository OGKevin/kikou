import { invoke } from "@tauri-apps/api/core";
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
