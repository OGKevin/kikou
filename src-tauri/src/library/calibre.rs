use async_trait::async_trait;
use calibre_db::{Book, CalibreDatabase};
use std::path::PathBuf;
use std::sync::Arc;

use super::base::BookLibrary;
use crate::error::AppError;

#[derive(Clone)]
pub struct CalibreLibrary {
    db: Arc<CalibreDatabase>,
}

impl CalibreLibrary {
    pub fn new(library_path: PathBuf) -> Result<Self, AppError> {
        let metadata_db_path = library_path.join("metadata.db");

        if !metadata_db_path.exists() {
            return Err(AppError::LibraryError(format!(
                "Calibre database not found at: {}",
                metadata_db_path.display()
            )));
        }

        let db = CalibreDatabase::open(metadata_db_path)
            .map_err(|e| AppError::LibraryError(e.to_string()))?;

        Ok(CalibreLibrary { db: Arc::new(db) })
    }
}

// SAFETY: CalibreDatabase wraps rusqlite::Connection, which is thread-safe.
// rusqlite uses SQLite's built-in locking mechanisms to ensure safe concurrent access.
// All database operations in this crate are read-only, preventing data races.
// The Arc<CalibreDatabase> pattern safely shares the connection across async tasks.
unsafe impl Send for CalibreLibrary {}
unsafe impl Sync for CalibreLibrary {}

#[async_trait]
impl BookLibrary for CalibreLibrary {
    async fn get_all_books(&self) -> Result<Vec<Book>, AppError> {
        self.db
            .all_books()
            .map_err(|e| AppError::LibraryError(e.to_string()))
    }

    async fn get_book(&self, book_id: u32) -> Result<Book, AppError> {
        self.db
            .get_book(book_id)
            .map_err(|e| AppError::LibraryError(e.to_string()))
    }

    async fn get_book_count(&self) -> Result<u32, AppError> {
        self.db
            .all_books()
            .map(|books| books.len() as u32)
            .map_err(|e| AppError::LibraryError(e.to_string()))
    }

    fn clone_box(&self) -> Box<dyn BookLibrary> {
        Box::new(self.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invalid_library_path() {
        let result = CalibreLibrary::new(PathBuf::from("/nonexistent/path"));
        assert!(result.is_err());
    }
}
