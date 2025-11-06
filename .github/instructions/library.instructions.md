---
applyTo: "src-tauri/src/library/**/*.rs"
---

# Library Module - Implementation-Agnostic Library Access

The library module provides a unified interface for accessing book library metadata from different sources (Calibre, Kobo, Amazon, etc.) through URI-based routing and a trait-based abstraction.

## Architecture

### Design Principle

The module is designed to be **implementation-agnostic**. The frontend communicates library requests through URIs with schemes that indicate the implementation type (e.g., `calibre:///path/to/library`). The backend parses these URIs and manages the appropriate library implementation transparently.

### Key Components

- `base.rs`: `BookLibrary` trait defining the interface all implementations must provide
- `calibre.rs`: Calibre-specific implementation of `BookLibrary`
- `commands.rs`: Tauri command handlers that parse URIs and delegate to implementations
- `mod.rs`: Module exports
- `LibraryState`: Manages the currently open library (trait object) in application state

### URI Scheme Format

Libraries are identified by URIs with implementation-specific schemes:

```
calibre:///absolute/path/to/library
calibre://relative/path/to/library
```

The scheme determines which implementation to use; the path portion is passed to that implementation.

## BookLibrary Trait

The `BookLibrary` trait defines the interface all library implementations must provide:

```rust
#[async_trait]
pub trait BookLibrary: Send + Sync {
    async fn get_all_books(&self) -> Result<Vec<Book>, AppError>;
    async fn get_book(&self, book_id: u32) -> Result<Book, AppError>;
    async fn get_book_count(&self) -> Result<u32, AppError>;
    fn clone_box(&self) -> Box<dyn BookLibrary>;
}
```

### Key Design Patterns

- **Async-first**: All methods use `async/await` for non-blocking I/O
- **Thread-safe**: Require `Send + Sync` for use across async boundaries
- **Arc wrapper**: Share database connections across async tasks safely
- **Error conversion**: Convert backend-specific errors to `AppError`
- **Polymorphic cloning**: `clone_box()` allows trait objects to be cloned

## Tauri Commands

All library commands are prefixed with `library_` for clarity and follow a consistent pattern:

### `library_open(uri: String) -> Result<(), String>`

Opens a library from the specified URI and stores it in application state.

**Example frontend usage:**

```typescript
const libraryPath = "/home/user/.local/share/calibre/";
await invoke("library_open", { uri: `calibre://${libraryPath}` });
```

### `library_get_all_books() -> Result<Vec<Book>, String>`

Returns all books from the currently open library. The library must be opened first via `library_open`.

### `library_get_book(book_id: u32) -> Result<Book, String>`

Returns a single book with the specified ID from the currently open library.

### `library_get_book_count() -> Result<u32, String>`

Returns the total count of books in the currently open library.

## State Management

- `LibraryState` holds an `Arc<Mutex<Option<Box<dyn BookLibrary>>>>`
- The `Arc` allows safe sharing across async tasks
- The `Mutex` serializes access to prevent data races
- The `Option` indicates whether a library is currently open
- The trait object (`Box<dyn BookLibrary>`) stores any implementation

## Send + Sync Implementation

When implementing `BookLibrary` for thread-safe resources, implementations may need to declare `unsafe impl Send + Sync`. This is required when:

1. The underlying resource provides thread-safe guarantees (SQLite, etc.)
2. Operations are read-only or properly synchronized
3. Reference counting (Arc) is used for safe sharing
4. No mutable state is exposed across thread boundaries

For detailed information about `unsafe impl Send + Sync` and its justification, see `library.calibre.instructions.md` for the Calibre implementation example.

## Adding New Library Implementations

To add support for a new library type:

1. Create a new module (e.g., `kobo.rs`) implementing the `BookLibrary` trait
2. Implement required methods:
   - `async fn get_all_books(&self) -> Result<Vec<Book>, AppError>`
   - `async fn get_book(&self, book_id: u32) -> Result<Book, AppError>`
   - `async fn get_book_count(&self) -> Result<u32, AppError>`
   - `fn clone_box(&self) -> Box<dyn BookLibrary>`
3. Add necessary trait implementations (Send, Sync, Clone, etc.)
4. Add a variant to the `LibraryUri` enum in `commands.rs`
5. Update `LibraryUri::parse()` to recognize the new URI scheme
6. Update the match statement in `library_open` to instantiate your implementation
7. Add your module to `mod.rs` and export from `base.rs`

Example implementation steps:

```rust
// In kobo.rs
#[derive(Clone)]
pub struct KoboLibrary {
    db: Arc<KoboDatabase>,
}

impl KoboLibrary {
    pub fn new(library_path: PathBuf) -> Result<Self, AppError> {
        // Implementation here
    }
}

unsafe impl Send for KoboLibrary {}
unsafe impl Sync for KoboLibrary {}

#[async_trait]
impl BookLibrary for KoboLibrary {
    async fn get_all_books(&self) -> Result<Vec<Book>, AppError> {
        // Implementation
    }
    // ... other methods
}

// In commands.rs LibraryUri::parse()
if let Some(path) = uri.strip_prefix("kobo://") {
    Ok(LibraryUri::Kobo(PathBuf::from(path)))
}

// In library_open match
LibraryUri::Kobo(path) => {
    let kobo_library = KoboLibrary::new(path).map_err(|e| e.to_string())?;
    Box::new(kobo_library)
}
```

## Error Handling

Error handling follows the unified strategy defined in `error.instructions.md`. Key points for the library module:

- **Tauri commands** return `Result<T, AppError>` for proper serialization across IPC
- **Internal functions** use domain-specific error enums (e.g., `LibraryError`) for type safety
- **Error conversion** implements `From` traits to convert internal errors to `AppError`
- **Invalid URIs** are rejected at parse time with descriptive `ValidationError` messages
- **Missing libraries** should return `LibraryError` variants
- **Library not open** conditions should return appropriate `LibraryError` or `ValidationError`

For detailed error handling patterns, see `error.instructions.md`.

## Testing Guidelines

- Test each implementation's `BookLibrary` trait methods independently
- Test URI parsing for valid and invalid formats
- Test state transitions (open, query, close)
- Verify error handling for missing libraries and invalid paths
- Use temporary directories for file-based library tests
- Never require external services or real libraries in tests
- Verify thread-safety with concurrent access patterns if needed

## Code Organization

Keep the module organized:

- Each library implementation in its own file
- Shared types and trait in `base.rs`
- Commands layer in `commands.rs`
- Export public API through `mod.rs`
