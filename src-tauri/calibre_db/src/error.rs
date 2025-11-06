use std::fmt;

#[derive(Debug)]
pub enum CalibreDbError {
    DatabaseError(rusqlite::Error),
    NotFound(String),
    InvalidData(String),
    IoError(String),
    SerializationError(String),
}

impl fmt::Display for CalibreDbError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CalibreDbError::DatabaseError(err) => write!(f, "Database error: {}", err),
            CalibreDbError::NotFound(msg) => write!(f, "Not found: {}", msg),
            CalibreDbError::InvalidData(msg) => write!(f, "Invalid data: {}", msg),
            CalibreDbError::IoError(msg) => write!(f, "IO error: {}", msg),
            CalibreDbError::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
        }
    }
}

impl std::error::Error for CalibreDbError {}

impl From<rusqlite::Error> for CalibreDbError {
    fn from(err: rusqlite::Error) -> Self {
        CalibreDbError::DatabaseError(err)
    }
}

impl From<std::io::Error> for CalibreDbError {
    fn from(err: std::io::Error) -> Self {
        CalibreDbError::IoError(err.to_string())
    }
}

impl From<serde_json::Error> for CalibreDbError {
    fn from(err: serde_json::Error) -> Self {
        CalibreDbError::SerializationError(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, CalibreDbError>;

/// Extension trait to convert `QueryReturnedNoRows` errors into `Ok(None)`.
/// This is useful for queries that may or may not return a row.
pub trait OptionalResult<T> {
    /// Converts a database query result to an `Option`, treating `QueryReturnedNoRows` as `None`.
    fn optional(self) -> Result<Option<T>>;
}

impl<T> OptionalResult<T> for Result<T> {
    fn optional(self) -> Result<Option<T>> {
        match self {
            Ok(value) => Ok(Some(value)),
            Err(CalibreDbError::DatabaseError(rusqlite::Error::QueryReturnedNoRows)) => Ok(None),
            Err(e) => Err(e),
        }
    }
}
