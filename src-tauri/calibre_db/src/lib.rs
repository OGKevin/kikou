mod error;
mod models;
mod schema;
mod queries;

pub use error::{CalibreDbError, Result};
pub use models::{Book, Author, Series, Tag, Identifier, BookMetadata};
pub use schema::DatabaseConnection;

use std::path::Path;

pub struct CalibreDatabase {
    conn: DatabaseConnection,
}

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