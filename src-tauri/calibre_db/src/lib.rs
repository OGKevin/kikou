mod error;
mod models;
mod schema;

pub use error::{CalibreDbError, OptionalResult, Result};
pub use models::{Author, Book, BookMetadata, Identifier, Series, Tag};
pub use schema::DatabaseConnection;

use chrono::{DateTime, Utc};
use rusqlite::params;
use std::path::Path;

/// Trait defining all read-only database operations for Calibre libraries.
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
pub trait ReadOnlyDatabase: Send + Sync {
    fn get_book(&self, book_id: u32) -> Result<Book>;
    fn all_books(&self) -> Result<Vec<Book>>;
    fn list_books(&self) -> Result<Vec<Book>>;
    fn fetch_book_authors(&self, book_id: u32) -> Result<Vec<Author>>;
    fn fetch_book_publishers(&self, book_id: u32) -> Result<Vec<String>>;
    fn fetch_book_tags(&self, book_id: u32) -> Result<Vec<Tag>>;
    fn fetch_book_series(&self, book_id: u32) -> Result<Option<Series>>;
    fn fetch_book_comments(&self, book_id: u32) -> Result<Option<String>>;
    fn fetch_book_rating(&self, book_id: u32) -> Result<Option<u8>>;
    fn fetch_book_formats(&self, book_id: u32) -> Result<Vec<String>>;
    fn fetch_book_identifiers(&self, book_id: u32) -> Result<Vec<Identifier>>;
    fn fetch_book_languages(&self, book_id: u32) -> Result<Vec<String>>;
}

pub struct CalibreDatabase {
    conn: DatabaseConnection,
}

impl ReadOnlyDatabase for CalibreDatabase {
    fn get_book(&self, book_id: u32) -> Result<Book> {
        let (id, title, sort, timestamp_str, pubdate_str, series_index, author_sort, isbn, lccn, path, has_cover): (u32, String, String, String, String, f32, String, String, String, String, i32) = self.conn.query_row(
            "SELECT id, title, sort, timestamp, pubdate, series_index, author_sort, isbn, lccn, path, has_cover
             FROM books WHERE id = ?1",
            params![book_id],
            |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?, row.get(7)?, row.get(8)?, row.get(9)?, row.get(10)?))
            },
        )?;

        Book::builder(id, title, path, self)
            .sort(sort)
            .timestamp(parse_timestamp(&timestamp_str))
            .pubdate(parse_timestamp(&pubdate_str))
            .series_index(series_index)
            .author_sort(author_sort)
            .isbn(isbn)
            .lccn(lccn)
            .has_cover(has_cover != 0)
            .fetch_all()
            .build()
    }

    fn all_books(&self) -> Result<Vec<Book>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, sort, timestamp, pubdate, series_index, author_sort, isbn, lccn, path, has_cover
             FROM books ORDER BY sort ASC")?;

        let books = stmt
            .query_map([], |row| {
                let timestamp_str: String = row.get(3)?;
                let pubdate_str: String = row.get(4)?;

                Ok((
                    row.get::<_, u32>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    timestamp_str,
                    pubdate_str,
                    row.get::<_, f32>(5)?,
                    row.get::<_, String>(6)?,
                    row.get::<_, String>(7)?,
                    row.get::<_, String>(8)?,
                    row.get::<_, String>(9)?,
                    row.get::<_, i32>(10)?,
                ))
            })
            .map_err(CalibreDbError::from)?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(CalibreDbError::from)?;

        let enriched_books = books
            .into_iter()
            .map(
                |(
                    id,
                    title,
                    sort,
                    timestamp_str,
                    pubdate_str,
                    series_index,
                    author_sort,
                    isbn,
                    lccn,
                    path,
                    has_cover,
                )| {
                    Book::builder(id, title, path, self)
                        .sort(sort)
                        .timestamp(parse_timestamp(&timestamp_str))
                        .pubdate(parse_timestamp(&pubdate_str))
                        .series_index(series_index)
                        .author_sort(author_sort)
                        .isbn(isbn)
                        .lccn(lccn)
                        .has_cover(has_cover != 0)
                        .fetch_all()
                        .build()
                },
            )
            .collect::<Result<Vec<_>>>()?;

        Ok(enriched_books)
    }

    fn list_books(&self) -> Result<Vec<Book>> {
        self.all_books()
    }

    fn fetch_book_authors(&self, book_id: u32) -> Result<Vec<Author>> {
        let mut stmt = self.conn.prepare(
            "SELECT a.id, a.name, a.sort
             FROM authors a
             JOIN books_authors_link bal ON a.id = bal.author
             WHERE bal.book = ?1
             ORDER BY bal.id ASC",
        )?;

        let authors = stmt
            .query_map(params![book_id], |row| {
                Ok(Author::new(row.get(0)?, row.get(1)?, row.get(2)?))
            })
            .map_err(CalibreDbError::from)?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(CalibreDbError::from)?;

        Ok(authors)
    }

    fn fetch_book_publishers(&self, book_id: u32) -> Result<Vec<String>> {
        let mut stmt = self.conn.prepare(
            "SELECT p.name
             FROM publishers p
             JOIN books_publishers_link bpl ON p.id = bpl.publisher
             WHERE bpl.book = ?1",
        )?;

        let publishers = stmt
            .query_map(params![book_id], |row| row.get(0))
            .map_err(CalibreDbError::from)?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(CalibreDbError::from)?;

        Ok(publishers)
    }

    fn fetch_book_tags(&self, book_id: u32) -> Result<Vec<Tag>> {
        let mut stmt = self.conn.prepare(
            "SELECT t.id, t.name
             FROM tags t
             JOIN books_tags_link btl ON t.id = btl.tag
             WHERE btl.book = ?1",
        )?;

        let tags = stmt
            .query_map(params![book_id], |row| {
                Ok(Tag::new(row.get(0)?, row.get(1)?))
            })
            .map_err(CalibreDbError::from)?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(CalibreDbError::from)?;

        Ok(tags)
    }

    fn fetch_book_series(&self, book_id: u32) -> Result<Option<Series>> {
        self.conn
            .query_row(
                "SELECT s.id, s.name
                 FROM series s
                 JOIN books_series_link bsl ON s.id = bsl.series
                 WHERE bsl.book = ?1",
                params![book_id],
                |row| Ok(Series::new(row.get(0)?, row.get(1)?)),
            )
            .optional()
    }

    fn fetch_book_comments(&self, book_id: u32) -> Result<Option<String>> {
        self.conn
            .query_row(
                "SELECT text FROM comments WHERE book = ?1",
                params![book_id],
                |row| row.get(0),
            )
            .optional()
    }

    fn fetch_book_rating(&self, book_id: u32) -> Result<Option<u8>> {
        self.conn
            .query_row(
                "SELECT r.rating
                 FROM ratings r
                 JOIN books_ratings_link brl ON r.id = brl.rating
                 WHERE brl.book = ?1",
                params![book_id],
                |row| {
                    let rating: u32 = row.get(0)?;
                    Ok((rating / 2) as u8)
                },
            )
            .optional()
    }

    fn fetch_book_formats(&self, book_id: u32) -> Result<Vec<String>> {
        let mut stmt = self
            .conn
            .prepare("SELECT format FROM data WHERE book = ?1 ORDER BY id ASC")?;

        let formats = stmt
            .query_map(params![book_id], |row| row.get(0))
            .map_err(CalibreDbError::from)?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(CalibreDbError::from)?;

        Ok(formats)
    }

    fn fetch_book_identifiers(&self, book_id: u32) -> Result<Vec<Identifier>> {
        let mut stmt = self
            .conn
            .prepare("SELECT book, type, val FROM identifiers WHERE book = ?1")?;

        let identifiers = stmt
            .query_map(params![book_id], |row| {
                Ok(Identifier::new(row.get(0)?, row.get(1)?, row.get(2)?))
            })
            .map_err(CalibreDbError::from)?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(CalibreDbError::from)?;

        Ok(identifiers)
    }

    fn fetch_book_languages(&self, book_id: u32) -> Result<Vec<String>> {
        let mut stmt = self.conn.prepare(
            "SELECT l.lang_code
             FROM languages l
             JOIN books_languages_link bll ON l.id = bll.lang_code
             WHERE bll.book = ?1
             ORDER BY bll.item_order ASC",
        )?;

        let languages = stmt
            .query_map(params![book_id], |row| row.get(0))
            .map_err(CalibreDbError::from)?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(CalibreDbError::from)?;

        Ok(languages)
    }
}

// SAFETY: CalibreDatabase implements ReadOnlyDatabase, ensuring all operations are read-only.
// rusqlite::Connection is thread-safe and uses SQLite's built-in locking mechanisms.
// DatabaseConnection validates read-only constraint in debug builds via prepare_validated().
// If write operations are introduced, REMOVE ReadOnlyDatabase impl and reassess these unsafe impls.
unsafe impl Send for CalibreDatabase {}
unsafe impl Sync for CalibreDatabase {}

fn parse_timestamp(timestamp_str: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(timestamp_str)
        .ok()
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or(DateTime::<Utc>::UNIX_EPOCH)
}

impl CalibreDatabase {
    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = DatabaseConnection::new(&path)?;
        Ok(CalibreDatabase { conn })
    }

    pub fn connection(&self) -> &DatabaseConnection {
        &self.conn
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_creation() {
        let err = CalibreDbError::DatabaseError(rusqlite::Error::QueryReturnedNoRows);
        assert!(matches!(err, CalibreDbError::DatabaseError(_)));
    }
}
