use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppError {
    LibraryError(String),
    BookNotFound(String),
    DatabaseError(String),
    IoError(String),
    ValidationError(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::LibraryError(msg) => write!(f, "Library error: {}", msg),
            AppError::BookNotFound(msg) => write!(f, "Book not found: {}", msg),
            AppError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
            AppError::IoError(msg) => write!(f, "IO error: {}", msg),
            AppError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}
