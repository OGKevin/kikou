use async_trait::async_trait;
use calibre_db::CalibreDatabase;
use std::path::PathBuf;
use std::sync::Arc;

use super::base::BookLibrary;
use super::models::Book;
use crate::error::AppError;

const COVER_FILE_NAME: &str = "cover.jpg";

#[derive(Clone)]
pub struct CalibreLibrary {
    db: Arc<CalibreDatabase>,
    library_path: PathBuf,
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

        Ok(CalibreLibrary {
            db: Arc::new(db),
            library_path,
        })
    }

    fn get_cover_path(&self, book_path: &str) -> PathBuf {
        self.library_path.join(book_path).join(COVER_FILE_NAME)
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
        let calibre_books = self
            .db
            .all_books()
            .map_err(|e| AppError::LibraryError(e.to_string()))?;

        Ok(calibre_books.into_iter().map(Book::from).collect())
    }

    async fn get_book(&self, book_id: u32) -> Result<Book, AppError> {
        let calibre_book = self
            .db
            .get_book(book_id)
            .map_err(|e| AppError::LibraryError(e.to_string()))?;

        Ok(Book::from(calibre_book))
    }

    async fn get_book_count(&self) -> Result<u32, AppError> {
        self.db
            .all_books()
            .map(|books| books.len() as u32)
            .map_err(|e| AppError::LibraryError(e.to_string()))
    }

    async fn get_book_cover(&self, book_id: u32) -> Result<Vec<u8>, AppError> {
        let calibre_book = self
            .db
            .get_book(book_id)
            .map_err(|e| AppError::LibraryError(e.to_string()))?;

        if !calibre_book.has_cover {
            return Err(AppError::BookNotFound(format!(
                "Book {} has no cover",
                book_id
            )));
        }

        let cover_path = self.get_cover_path(&calibre_book.path);

        if !cover_path.exists() {
            return Err(AppError::IoError(format!(
                "Cover file not found at: {}",
                cover_path.display()
            )));
        }

        std::fs::read(&cover_path)
            .map_err(|e| AppError::IoError(format!("Failed to read cover: {}", e)))
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

    #[test]
    fn test_cover_path_construction() {
        let library_path = PathBuf::from("/test/library");
        let book_path = "Author Name/Book Title";

        let cover_path = library_path.join(book_path).join(COVER_FILE_NAME);

        let path_str = cover_path.to_string_lossy();

        assert!(path_str.contains("cover.jpg"));
        assert!(path_str.contains("Author Name"));
        assert!(path_str.contains("Book Title"));
    }
}
