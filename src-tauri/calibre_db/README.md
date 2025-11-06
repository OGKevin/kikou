# calibre_db

A Rust library for reading book metadata from Calibre SQLite databases.

## Overview

`calibre_db` provides safe, type-safe access to book metadata stored in Calibre's SQLite database format. It abstracts away the complexity of the database schema and query logic, offering a clean API for retrieving books, authors, series, tags, and other metadata.

This crate is designed to be published on crates.io as a standalone library, making it easy to integrate Calibre database reading into any Rust application.

## Features

- **Type-safe models**: Strongly-typed structures for books, authors, series, tags, and identifiers
- **Comprehensive metadata**: Retrieve all book details including cover information, formats, ratings, and comments
- **Many-to-many relations**: Proper handling of complex relationships (authors per book, tags per book, etc.)
- **Error handling**: Comprehensive error types with conversions from common error sources
- **Thread-safe**: Uses `rusqlite` with safe connection handling
- **Well-tested**: Comprehensive unit and integration tests

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
calibre_db = "0.1"
```

## Quick Start

```rust
use calibre_db::CalibreDatabase;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db = CalibreDatabase::open("/path/to/library/metadata.db")?;

    // Get a specific book
    let book = db.get_book(1)?;
    println!("Title: {}", book.title);
    println!("Authors: {:?}", book.authors);

    // Get all books
    let books = db.all_books()?;
    println!("Total books: {}", books.len());

    Ok(())
}
```

## Database Schema

The crate works with Calibre's standard SQLite schema, which includes:

- **books**: Core book information (title, dates, ISBN, etc.)
- **authors**: Author metadata with sort names
- **publishers**: Publisher information
- **tags**: Tag/category information
- **series**: Series metadata
- **data**: Format information (EPUB, PDF, MOBI, etc.)
- **comments**: Book descriptions/comments
- **ratings**: Star ratings
- **identifiers**: Book identifiers (ISBN, DOI, etc.)
- **languages**: Language information

All many-to-many relationships are properly handled through link tables.

## API Overview

### Main Entry Point

```rust
pub struct CalibreDatabase {
    // ...
}

impl CalibreDatabase {
    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self>;
    pub fn get_book(&self, book_id: u32) -> Result<Book>;
    pub fn all_books(&self) -> Result<Vec<Book>>;
}
```

### Core Models

- `Book`: Complete book information with all relations
- `Author`: Author data with sort name
- `Series`: Series information
- `Tag`: Tag/category information
- `Identifier`: Book identifier (ISBN, DOI, etc.)
- `BookMetadata`: Flattened metadata summary

## Examples

### Retrieve a Single Book

```rust
use calibre_db::CalibreDatabase;

let db = CalibreDatabase::open("metadata.db")?;
let book = db.get_book(42)?;

println!("Title: {}", book.title);
println!("Authors: {}", book.authors.iter()
    .map(|a| &a.name)
    .collect::<Vec<_>>()
    .join(", "));
println!("Series: {}", book.series.as_ref().map(|s| &s.name).unwrap_or(&"None".to_string()));
println!("Tags: {}", book.tags.iter()
    .map(|t| &t.name)
    .collect::<Vec<_>>()
    .join(", "));
```

### Retrieve All Books

```rust
let db = CalibreDatabase::open("metadata.db")?;
let books = db.all_books()?;

for book in books {
    println!("{}: {} by {}",
        book.id,
        book.title,
        book.author_sort);
}
```

### Access Book Details

```rust
let book = db.get_book(1)?;

// Basic information
println!("Title: {}", book.title);
println!("Path: {}", book.path);
println!("Has cover: {}", book.has_cover);

// Dates
println!("Published: {}", book.pubdate);
println!("Added: {}", book.timestamp);

// Relations
println!("Authors: {} ({})",
    book.authors.len(),
    book.author_sort);
println!("Publishers: {}", book.publishers.join(", "));
println!("Tags: {}", book.tags.iter().map(|t| &t.name).collect::<Vec<_>>().join(", "));
println!("Languages: {}", book.languages.join(", "));
println!("Formats: {}", book.formats.join(", "));

// Optional fields
if let Some(series) = &book.series {
    println!("Series: {} ({})", series.name, book.series_index);
}
if let Some(rating) = book.rating {
    println!("Rating: {}/5", rating);
}
if let Some(comments) = &book.comments {
    println!("Comments: {}", comments);
}
```

## Error Handling

The crate provides comprehensive error types:

```rust
use calibre_db::{CalibreDatabase, CalibreDbError};

match db.get_book(9999) {
    Ok(book) => println!("Found: {}", book.title),
    Err(CalibreDbError::DatabaseError(msg)) => eprintln!("DB Error: {}", msg),
    Err(CalibreDbError::NotFound(msg)) => eprintln!("Not found: {}", msg),
    Err(e) => eprintln!("Error: {}", e),
}
```

## Performance Notes

- Books are fetched with all related metadata in a single operation
- The database uses indexes for efficient querying
- Results are ordered by book sort name for consistency
- Consider caching if you need to query the same book multiple times

## Thread Safety

`CalibreDatabase` is thread-safe and can be safely shared across threads using `Arc`:

```rust
use std::sync::Arc;
use calibre_db::CalibreDatabase;

let db = Arc::new(CalibreDatabase::open("metadata.db")?);
let db_clone = Arc::clone(&db);

std::thread::spawn(move || {
    let book = db_clone.get_book(1);
    // ...
});
```

## Testing

Run the test suite:

```bash
cargo test
```

Run integration tests specifically:

```bash
cargo test --test integration_tests
```

## Limitations

- Read-only: This crate currently supports reading only; modifications to the database are not supported
- Calibre format required: The database must be in Calibre's SQLite format
- No async support: Operations are synchronous (async support may be added as a feature in the future)

## Contributing

Contributions are welcome! Please ensure:

- All tests pass: `cargo test`
- Code is formatted: `cargo fmt`
- No clippy warnings: `cargo clippy`
- New features include tests

## License

[Your License Here]

## Related Projects

- [Calibre](https://calibre-ebook.com/): The main e-book management software
- [Kikou](https://github.com/yourusername/kikou): The Tauri application using this crate
