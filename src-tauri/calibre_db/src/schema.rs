use crate::error::{CalibreDbError, Result};
use rusqlite::Connection;
use std::path::Path;

pub struct DatabaseConnection {
    conn: Connection,
}

impl DatabaseConnection {
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        Ok(DatabaseConnection { conn })
    }

    pub fn query_row<F, T>(&self, query: &str, params: &[&dyn rusqlite::ToSql], f: F) -> Result<T>
    where
        F: FnOnce(&rusqlite::Row) -> rusqlite::Result<T>,
    {
        self.conn
            .query_row(query, params, f)
            .map_err(CalibreDbError::from)
    }

    pub fn prepare<'a>(&'a self, query: &str) -> Result<rusqlite::Statement<'a>> {
        self.conn.prepare(query).map_err(CalibreDbError::from)
    }
}

#[cfg(test)]
mod tests {
    use crate::CalibreDbError;

    use super::*;
    use tempfile::NamedTempFile;

    fn create_test_db() -> Result<(DatabaseConnection, NamedTempFile)> {
        let temp_file = NamedTempFile::new().map_err(CalibreDbError::from)?;
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
            "CREATE TABLE authors (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                sort TEXT
            )",
            [],
        )?;

        drop(conn);

        let db_conn = DatabaseConnection::new(&path)?;
        Ok((db_conn, temp_file))
    }

    #[test]
    fn test_database_connection_creation() {
        let result = create_test_db();
        assert!(result.is_ok());
    }

    #[test]
    fn test_query_row_with_select() {
        let (db_conn, _temp_file) = create_test_db().unwrap();

        let result: Result<i32> =
            db_conn.query_row("SELECT COUNT(*) FROM books", &[], |row| row.get(0));
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0);
    }
}
