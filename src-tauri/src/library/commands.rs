use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;
use tauri::State;

use calibre_db::Book;

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
