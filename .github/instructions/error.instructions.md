---
applyTo: "src-tauri/**/*.rs"
---

# Error Handling in Rust

Consistent error handling across all Rust modules using enums for type safety and clarity.

## Purpose
Provide a unified error handling strategy that:
- Prioritizes enum error types for domain-specific errors
- Ensures Tauri commands return the top-level `AppError` type for IPC communication
- Uses specific error enums for internal library functions
- Maintains clear error boundaries between modules

## Error Hierarchy

### Tauri Commands Layer
Tauri commands should always return `Result<T, AppError>` to ensure proper serialization for IPC:

```rust
#[tauri::command]
async fn fetch_book(lib: State<Arc<dyn BookLibrary>>, id: u32) -> Result<Book, AppError> {
    lib.get_book(id).await
}
```

### Internal Library Layer
Internal functions should use specific error enums for their domain:

```rust
pub enum LibraryError {
    BookNotFound(u32),
    InvalidPath(String),
    DatabaseFailure(String),
}

pub fn get_book_internal(id: u32) -> Result<Book, LibraryError> {
    // Implementation
}
```

### AppError - Top-Level Error Type
The unified error enum for converting all domain-specific errors to IPC-compatible format.

**Variants:**
- `LibraryError(String)`: General library operation failures (path validation, initialization)
- `BookNotFound(String)`: Specific book not found by ID or query
- `DatabaseError(String)`: Underlying SQLite or database failures
- `IoError(String)`: File system errors
- `ValidationError(String)`: Invalid input or data validation issues
- `ArchiveError(String)`: Archive/compression operation failures

## Error Conversion
Implement `From` traits to convert domain-specific errors to `AppError`:

```rust
impl From<LibraryError> for AppError {
    fn from(err: LibraryError) -> Self {
        match err {
            LibraryError::BookNotFound(id) => AppError::BookNotFound(format!("Book {} not found", id)),
            LibraryError::InvalidPath(p) => AppError::ValidationError(format!("Invalid path: {}", p)),
            LibraryError::DatabaseFailure(e) => AppError::DatabaseError(e),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::IoError(err.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::ValidationError(err.to_string())
    }
}
```

## Guidelines
- **Prioritize enums**: Use specific error enums for internal operations (e.g., `LibraryError`, `ArchiveError`)
- **Tauri boundary**: Always return `AppError` from Tauri commands
- **Error conversion**: Implement `From` traits to bridge domain-specific errors to `AppError`
- **Descriptive messages**: Include context in error messages for debugging
- **No panics**: Return errors instead of panicking in library code
- **Result types**: Use `Result<T, E>` consistently throughout the codebase