use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;
use tauri::ipc::Channel;
use tauri::State;

use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine};
use log::debug;
use serde::Serialize;

use super::models::Book;
use super::{BookLibrary, CalibreLibrary};

pub struct LibraryState {
    library: Arc<Mutex<Option<Box<dyn BookLibrary>>>>,
}

impl LibraryState {
    pub fn new() -> Self {
        Self {
            library: Arc::new(Mutex::new(None)),
        }
    }
}

impl Default for LibraryState {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug)]
enum LibraryUri {
    Calibre(PathBuf),
}

impl LibraryUri {
    fn parse(uri: &str) -> Result<Self, String> {
        if let Some(path) = uri.strip_prefix("calibre://") {
            Ok(LibraryUri::Calibre(PathBuf::from(path)))
        } else {
            Err(format!(
                "Unknown library URI scheme. Expected 'calibre://', got '{}'",
                uri
            ))
        }
    }
}

#[tauri::command]
pub async fn library_open(uri: String, state: State<'_, LibraryState>) -> Result<(), String> {
    let library_uri = LibraryUri::parse(&uri)?;

    let library: Box<dyn BookLibrary> = match library_uri {
        LibraryUri::Calibre(path) => {
            let calibre_library = CalibreLibrary::new(path).map_err(|e| e.to_string())?;
            Box::new(calibre_library)
        }
    };

    let mut library_guard = state
        .library
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    *library_guard = Some(library);

    Ok(())
}

#[tauri::command]
pub async fn library_get_all_books(state: State<'_, LibraryState>) -> Result<Vec<Book>, String> {
    let library = {
        let library_guard = state
            .library
            .lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;

        library_guard
            .as_ref()
            .ok_or_else(|| "No library opened. Call library_open first.".to_string())?
            .clone_box()
    };

    library.get_all_books().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn library_get_book(
    book_id: u32,
    state: State<'_, LibraryState>,
) -> Result<Book, String> {
    let library = {
        let library_guard = state
            .library
            .lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;

        library_guard
            .as_ref()
            .ok_or_else(|| "No library opened. Call library_open first.".to_string())?
            .clone_box()
    };

    library.get_book(book_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn library_get_book_count(state: State<'_, LibraryState>) -> Result<u32, String> {
    let library = {
        let library_guard = state
            .library
            .lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;

        library_guard
            .as_ref()
            .ok_or_else(|| "No library opened. Call library_open first.".to_string())?
            .clone_box()
    };

    library.get_book_count().await.map_err(|e| e.to_string())
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum CoverStreamEvent {
    Started {
        total_books: usize,
    },
    Cover {
        book_id: u32,
        data_base64: String,
    },
    Error {
        book_id: u32,
        message: String,
    },
    Finished,
}

#[tauri::command]
pub async fn library_stream_book_covers(
    book_ids: Vec<u32>,
    state: State<'_, LibraryState>,
    on_event: Channel<CoverStreamEvent>,
) -> Result<(), String> {
    let library = {
        let library_guard = state
            .library
            .lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;

        library_guard
            .as_ref()
            .ok_or_else(|| "No library opened. Call library_open first.".to_string())?
            .clone_box()
    };

    tauri::async_runtime::spawn(async move {
        let total = book_ids.len();

        if let Err(e) = on_event.send(CoverStreamEvent::Started { total_books: total }) {
            debug!("Failed to send Started event: {}", e);
            return;
        }

        for book_id in book_ids {
            match library.get_book_cover(book_id).await {
                Ok(cover_data) => {
                    let data_base64 = BASE64_STANDARD.encode(&cover_data);

                    if let Err(e) = on_event.send(CoverStreamEvent::Cover {
                        book_id,
                        data_base64,
                    }) {
                        debug!("Failed to send Cover event for book {}: {}", book_id, e);
                    }
                }
                Err(e) => {
                    if let Err(send_err) = on_event.send(CoverStreamEvent::Error {
                        book_id,
                        message: e.to_string(),
                    }) {
                        debug!(
                            "Failed to send Error event for book {}: {}",
                            book_id, send_err
                        );
                    }
                }
            }
        }

        if let Err(e) = on_event.send(CoverStreamEvent::Finished) {
            debug!("Failed to send Finished event: {}", e);
        }
    });

    Ok(())
}
