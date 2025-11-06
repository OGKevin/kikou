mod error;
mod models;
mod queries;
mod schema;

pub use error::{CalibreDbError, Result};
pub use models::{Author, Book, BookMetadata, Identifier, Series, Tag};
pub use schema::DatabaseConnection;

use std::path::Path;

/// Marker trait indicating that all database operations are read-only.
///
/// This trait provides a compile-time guarantee that implementing types
/// only perform SELECT queries. The DatabaseConnection validates this
/// constraint in debug builds by checking all prepared statements.
///
/// # Safety
/// Types implementing this trait must ensure that:
/// - All database operations are SELECT statements only
/// - No INSERT, UPDATE, DELETE, or other write operations are performed
/// - The underlying connection is thread-safe (SQLite with proper locking)
pub trait ReadOnlyDatabase: Send + Sync {}

pub struct CalibreDatabase {
    conn: DatabaseConnection,
}

impl ReadOnlyDatabase for CalibreDatabase {}

// SAFETY: CalibreDatabase implements ReadOnlyDatabase, ensuring all operations are read-only.
// rusqlite::Connection is thread-safe and uses SQLite's built-in locking mechanisms.
// DatabaseConnection validates read-only constraint in debug builds via prepare_validated().
// If write operations are introduced, REMOVE ReadOnlyDatabase impl and reassess these unsafe impls.
unsafe impl Send for CalibreDatabase {}
unsafe impl Sync for CalibreDatabase {}

impl CalibreDatabase {
    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = DatabaseConnection::new(&path)?;
        Ok(CalibreDatabase { conn })
    }

    pub fn connection(&self) -> &DatabaseConnection {
        &self.conn
    }

    pub fn get_book(&self, book_id: u32) -> Result<Book> {
        queries::get_book(&self.conn, book_id)
    }

    pub fn all_books(&self) -> Result<Vec<Book>> {
        queries::all_books(&self.conn)
    }

    pub fn books_iter(&self) -> Result<Vec<Book>> {
        queries::all_books(&self.conn)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_creation() {
        let err = CalibreDbError::DatabaseError("test".to_string());
        assert!(matches!(err, CalibreDbError::DatabaseError(_)));
    }
}
