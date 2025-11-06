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
        self.conn.query_row(query, params, f).map_err(Into::into)
    }

    pub fn prepare<'a>(&'a self, query: &str) -> Result<rusqlite::Statement<'a>> {
        self.prepare_validated(query)
    }

    /// Validates that a query is read-only (SELECT statement only)
    fn is_read_only_query(query: &str) -> bool {
        let trimmed = query.trim_start().to_uppercase();
        trimmed.starts_with("SELECT") || trimmed.starts_with("WITH")
    }

    /// Internal method to prepare a statement with read-only validation in debug builds
    fn prepare_validated<'a>(&'a self, query: &str) -> Result<rusqlite::Statement<'a>> {
        #[cfg(debug_assertions)]
        {
            if !Self::is_read_only_query(query) {
                return Err(CalibreDbError::InvalidData(format!(
                    "Only SELECT queries are allowed. Got: {}",
                    query
                        .split_whitespace()
                        .take(3)
                        .collect::<Vec<_>>()
                        .join(" ")
                )));
            }
        }
        self.conn.prepare(query).map_err(Into::into)
    }
}

#[cfg(test)]
mod tests {
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
    fn test_read_only_query_validation() {
        // Valid SELECT queries
        assert!(DatabaseConnection::is_read_only_query(
            "SELECT * FROM books"
        ));
        assert!(DatabaseConnection::is_read_only_query(
            "  SELECT id FROM authors"
        ));
        assert!(DatabaseConnection::is_read_only_query(
            "select * from books"
        ));
        assert!(DatabaseConnection::is_read_only_query(
            "WITH cte AS (SELECT 1) SELECT * FROM cte"
        ));

        // Invalid non-SELECT queries
        assert!(!DatabaseConnection::is_read_only_query(
            "INSERT INTO books VALUES (1)"
        ));
        assert!(!DatabaseConnection::is_read_only_query(
            "UPDATE books SET title = 'test'"
        ));
        assert!(!DatabaseConnection::is_read_only_query("DELETE FROM books"));
        assert!(!DatabaseConnection::is_read_only_query("DROP TABLE books"));
        assert!(!DatabaseConnection::is_read_only_query(
            "CREATE TABLE test (id INT)"
        ));
    }

    #[test]
    #[cfg(debug_assertions)]
    fn test_prepare_rejects_write_operations() {
        let (db_conn, _temp_file) = create_test_db().unwrap();

        // SELECT should work
        let result = db_conn.prepare("SELECT * FROM books");
        assert!(result.is_ok());

        // INSERT should fail in debug builds
        let result = db_conn.prepare("INSERT INTO books (title) VALUES ('test')");
        assert!(result.is_err());
        if let Err(CalibreDbError::InvalidData(msg)) = result {
            assert!(msg.contains("Only SELECT queries are allowed"));
        } else {
            panic!("Expected InvalidData error");
        }

        // UPDATE should fail in debug builds
        let result = db_conn.prepare("UPDATE books SET title = 'test'");
        assert!(result.is_err());

        // DELETE should fail in debug builds
        let result = db_conn.prepare("DELETE FROM books");
        assert!(result.is_err());
    }

    #[test]
    fn test_query_row_with_select() {
        let (db_conn, _temp_file) = create_test_db().unwrap();

        // query_row should work with SELECT (it doesn't go through prepare, so no validation)
        let result: Result<i32> =
            db_conn.query_row("SELECT COUNT(*) FROM books", &[], |row| row.get(0));
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0);
    }

    #[test]
    #[cfg(debug_assertions)]
    fn test_write_operations_rejected_in_debug() {
        let (db_conn, _temp_file) = create_test_db().unwrap();

        let write_operations = vec![
            ("INSERT", "INSERT INTO books (title) VALUES ('test')"),
            ("UPDATE", "UPDATE books SET title = 'test'"),
            ("DELETE", "DELETE FROM books"),
            ("CREATE", "CREATE TABLE test (id INT)"),
            ("DROP", "DROP TABLE books"),
            ("ALTER", "ALTER TABLE books ADD COLUMN new_col TEXT"),
        ];

        for (op_type, query) in write_operations {
            let result = db_conn.prepare(query);
            assert!(result.is_err(), "{} operation should be rejected", op_type);

            if let Err(CalibreDbError::InvalidData(msg)) = result {
                assert!(
                    msg.contains("Only SELECT queries are allowed"),
                    "Error message should mention read-only restriction for {} operation",
                    op_type
                );
            } else {
                panic!("{} operation should return InvalidData error", op_type);
            }
        }
    }

    #[test]
    fn test_valid_select_variants() {
        let (db_conn, _temp_file) = create_test_db().unwrap();

        let valid_selects = vec![
            "SELECT * FROM books",
            "SELECT id, title FROM books WHERE id = 1",
            "  SELECT * FROM authors",
            "select count(*) from books",
            "SELECT DISTINCT title FROM books",
            "WITH cte AS (SELECT 1) SELECT * FROM cte",
            "WITH RECURSIVE cte AS (SELECT 1) SELECT * FROM cte",
        ];

        for query in valid_selects {
            let result = db_conn.prepare(query);
            assert!(result.is_ok(), "SELECT query should succeed: {}", query);
        }
    }
}
