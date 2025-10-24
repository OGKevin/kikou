use crate::error::{CalibreDbError, Result};
use crate::models::{Author, Book, Identifier, Series, Tag};
use crate::schema::DatabaseConnection;
use chrono::{DateTime, Utc};
use rusqlite::params;

pub fn get_book(conn: &DatabaseConnection, book_id: u32) -> Result<Book> {
    let mut book = conn.query_row(
        "SELECT id, title, sort, timestamp, pubdate, series_index, author_sort, isbn, lccn, path, has_cover
         FROM books WHERE id = ?1",
        params![book_id],
        |row| {
            let timestamp_str: String = row.get(3)?;
            let pubdate_str: String = row.get(4)?;

            Ok(Book::new(
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                parse_timestamp(&timestamp_str),
                parse_timestamp(&pubdate_str),
                row.get(5)?,
                row.get(6)?,
                row.get(7)?,
                row.get(8)?,
                row.get(9)?,
                row.get::<_, i32>(10)? != 0,
            ))
        },
    )?;

    let bid = book.id;
    book = book.with_authors(get_book_authors(conn, bid)?);
    book = book.with_publishers(get_book_publishers(conn, bid)?);
    book = book.with_tags(get_book_tags(conn, bid)?);
    book = book.with_series(get_book_series(conn, bid)?);
    book = book.with_comments(get_book_comments(conn, bid)?);
    book = book.with_rating(get_book_rating(conn, bid)?);
    book = book.with_formats(get_book_formats(conn, bid)?);
    book = book.with_identifiers(get_book_identifiers(conn, bid)?);
    book = book.with_languages(get_book_languages(conn, bid)?);

    Ok(book)
}

pub fn all_books(conn: &DatabaseConnection) -> Result<Vec<Book>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, sort, timestamp, pubdate, series_index, author_sort, isbn, lccn, path, has_cover
         FROM books ORDER BY sort ASC")?;

    let books = stmt
        .query_map([], |row| {
            let timestamp_str: String = row.get(3)?;
            let pubdate_str: String = row.get(4)?;

            Ok(Book::new(
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                parse_timestamp(&timestamp_str),
                parse_timestamp(&pubdate_str),
                row.get(5)?,
                row.get(6)?,
                row.get(7)?,
                row.get(8)?,
                row.get(9)?,
                row.get::<_, i32>(10)? != 0,
            ))
        })
        .map_err(|e| CalibreDbError::from(e))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| CalibreDbError::from(e))?;

    let mut enriched_books = Vec::new();

    for book in books {
        let book_id = book.id;
        let mut enriched = book;
        enriched = enriched.with_authors(get_book_authors(conn, book_id)?);
        enriched = enriched.with_publishers(get_book_publishers(conn, book_id)?);
        enriched = enriched.with_tags(get_book_tags(conn, book_id)?);
        enriched = enriched.with_series(get_book_series(conn, book_id)?);
        enriched = enriched.with_comments(get_book_comments(conn, book_id)?);
        enriched = enriched.with_rating(get_book_rating(conn, book_id)?);
        enriched = enriched.with_formats(get_book_formats(conn, book_id)?);
        enriched = enriched.with_identifiers(get_book_identifiers(conn, book_id)?);
        enriched = enriched.with_languages(get_book_languages(conn, book_id)?);

        enriched_books.push(enriched);
    }

    Ok(enriched_books)
}

fn get_book_authors(conn: &DatabaseConnection, book_id: u32) -> Result<Vec<Author>> {
    let mut stmt = conn.prepare(
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
        .map_err(|e| CalibreDbError::from(e))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| CalibreDbError::from(e))?;

    Ok(authors)
}

fn get_book_publishers(conn: &DatabaseConnection, book_id: u32) -> Result<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT p.name
         FROM publishers p
         JOIN books_publishers_link bpl ON p.id = bpl.publisher
         WHERE bpl.book = ?1",
    )?;

    let publishers = stmt
        .query_map(params![book_id], |row| row.get(0))
        .map_err(|e| CalibreDbError::from(e))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| CalibreDbError::from(e))?;

    Ok(publishers)
}

fn get_book_tags(conn: &DatabaseConnection, book_id: u32) -> Result<Vec<Tag>> {
    let mut stmt = conn.prepare(
        "SELECT t.id, t.name
         FROM tags t
         JOIN books_tags_link btl ON t.id = btl.tag
         WHERE btl.book = ?1",
    )?;

    let tags = stmt
        .query_map(params![book_id], |row| {
            Ok(Tag::new(row.get(0)?, row.get(1)?))
        })
        .map_err(|e| CalibreDbError::from(e))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| CalibreDbError::from(e))?;

    Ok(tags)
}

fn get_book_series(conn: &DatabaseConnection, book_id: u32) -> Result<Option<Series>> {
    let result = conn.query_row(
        "SELECT s.id, s.name
         FROM series s
         JOIN books_series_link bsl ON s.id = bsl.series
         WHERE bsl.book = ?1",
        params![book_id],
        |row| Ok(Series::new(row.get(0)?, row.get(1)?)),
    );

    match result {
        Ok(series) => Ok(Some(series)),
        Err(CalibreDbError::DatabaseError(ref msg)) if msg.contains("no rows") => Ok(None),
        Err(e) => Err(e),
    }
}

fn get_book_comments(conn: &DatabaseConnection, book_id: u32) -> Result<Option<String>> {
    let result = conn.query_row(
        "SELECT text FROM comments WHERE book = ?1",
        params![book_id],
        |row| row.get(0),
    );

    match result {
        Ok(text) => Ok(Some(text)),
        Err(CalibreDbError::DatabaseError(ref msg)) if msg.contains("no rows") => Ok(None),
        Err(e) => Err(e),
    }
}

fn get_book_rating(conn: &DatabaseConnection, book_id: u32) -> Result<Option<u8>> {
    let result = conn.query_row(
        "SELECT r.rating
         FROM ratings r
         JOIN books_ratings_link brl ON r.id = brl.rating
         WHERE brl.book = ?1",
        params![book_id],
        |row| {
            let rating: u32 = row.get(0)?;
            Ok((rating / 2) as u8)
        },
    );

    match result {
        Ok(rating) => Ok(Some(rating)),
        Err(CalibreDbError::DatabaseError(ref msg)) if msg.contains("no rows") => Ok(None),
        Err(e) => Err(e),
    }
}

fn get_book_formats(conn: &DatabaseConnection, book_id: u32) -> Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT format FROM data WHERE book = ?1 ORDER BY id ASC")?;

    let formats = stmt
        .query_map(params![book_id], |row| row.get(0))
        .map_err(|e| CalibreDbError::from(e))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| CalibreDbError::from(e))?;

    Ok(formats)
}

fn get_book_identifiers(conn: &DatabaseConnection, book_id: u32) -> Result<Vec<Identifier>> {
    let mut stmt = conn.prepare("SELECT book, type, val FROM identifiers WHERE book = ?1")?;

    let identifiers = stmt
        .query_map(params![book_id], |row| {
            Ok(Identifier::new(row.get(0)?, row.get(1)?, row.get(2)?))
        })
        .map_err(|e| CalibreDbError::from(e))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| CalibreDbError::from(e))?;

    Ok(identifiers)
}

fn get_book_languages(conn: &DatabaseConnection, book_id: u32) -> Result<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT l.lang_code
         FROM languages l
         JOIN books_languages_link bll ON l.id = bll.lang_code
         WHERE bll.book = ?1
         ORDER BY bll.item_order ASC",
    )?;

    let languages = stmt
        .query_map(params![book_id], |row| row.get(0))
        .map_err(|e| CalibreDbError::from(e))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| CalibreDbError::from(e))?;

    Ok(languages)
}

fn parse_timestamp(timestamp_str: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(timestamp_str)
        .ok()
        .and_then(|dt| Some(dt.with_timezone(&Utc)))
        .unwrap_or_else(|| Utc::now())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use tempfile::NamedTempFile;

    fn create_test_db_with_books() -> Result<(DatabaseConnection, NamedTempFile)> {
        let temp_file = NamedTempFile::new().map_err(|e| CalibreDbError::from(e))?;
        let path = temp_file.path().to_path_buf();

        let conn = Connection::open(&path)?;

        conn.execute(
            "CREATE TABLE books (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                sort TEXT,
                timestamp TIMESTAMP,
                pubdate TIMESTAMP,
                series_index REAL,
                author_sort TEXT,
                isbn TEXT,
                lccn TEXT,
                path TEXT,
                has_cover BOOLEAN DEFAULT 0
            )",
            [],
        )?;

        conn.execute(
            "INSERT INTO books (id, title, sort, timestamp, pubdate, series_index, author_sort, isbn, lccn, path, has_cover)
             VALUES (1, 'Test Book', 'book, test', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', 1.0, 'Author, Test', '123-456', '', '/test', 0)",
            [],
        )?;

        conn.execute(
            "CREATE TABLE authors (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                sort TEXT
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE books_authors_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                author INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE publishers (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE books_publishers_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                publisher INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE tags (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE books_tags_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                tag INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE series (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE books_series_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                series INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE comments (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                text TEXT
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE ratings (
                id INTEGER PRIMARY KEY,
                rating INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE books_ratings_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                rating INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE data (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                format TEXT
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE identifiers (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                type TEXT,
                val TEXT
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE languages (
                id INTEGER PRIMARY KEY,
                lang_code TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE books_languages_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                lang_code INTEGER,
                item_order INTEGER DEFAULT 0
            )",
            [],
        )?;

        drop(conn);

        let db_conn = DatabaseConnection::new(&path)?;
        Ok((db_conn, temp_file))
    }

    #[test]
    fn test_get_book_basic() {
        let result = create_test_db_with_books();
        assert!(result.is_ok());

        if let Ok((db, _temp)) = result {
            let book = get_book(&db, 1);
            assert!(book.is_ok());

            if let Ok(book) = book {
                assert_eq!(book.id, 1);
                assert_eq!(book.title, "Test Book");
            }
        }
    }

    #[test]
    fn test_all_books() {
        let result = create_test_db_with_books();
        assert!(result.is_ok());

        if let Ok((db, _temp)) = result {
            let books = all_books(&db);
            assert!(books.is_ok());

            if let Ok(books) = books {
                assert_eq!(books.len(), 1);
                assert_eq!(books[0].id, 1);
            }
        }
    }
}
