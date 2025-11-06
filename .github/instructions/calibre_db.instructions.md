---
applyTo: "src-tauri/calibre_db/**/*.rs"
---

# calibre_db Crate - Calibre SQLite Database Bindings

This is a standalone, publishable Rust crate providing type-safe access to Calibre SQLite databases based on Calibre's database schema (from `third_party/calibre/src/calibre/db`).

## Purpose
Read and deserialize book metadata from Calibre's SQLite `metadata.db` format, supporting 10 core tables (books, authors, publishers, tags, series, data, comments, ratings, identifiers, languages) and their many-to-many relationships.

## Key Modules
- `lib.rs`: Public API (`CalibreDatabase::open()`, `get_book()`, `all_books()`)
- `models.rs`: Book, Author, Series, Tag, Identifier data structures with builder patterns
- `schema.rs`: Database connection management and schema validation
- `queries.rs`: Query functions for books and related metadata
- `error.rs`: Error types (DatabaseError, NotFound, InvalidData, IoError, SerializationError)

## Development Guidelines
- Query functions return `Result<T>` or `Result<Option<T>>` for missing relations
- Use builder pattern (`with_authors()`, `with_tags()`, etc.) for complex object construction
- Handle missing relations gracefully (some books lack series, publishers, ratings)
- Always verify book IDs before querying relations in loops
- Parse timestamps using RFC 3339, fallback to Utc::now()
- Fetch complete book data in single operation for performance

## Database Schema Notes

### Languages Table
The `books_languages_link` table uses a foreign key relationship to the `languages` table:

```sql
CREATE TABLE languages (
    id INTEGER PRIMARY KEY,
    lang_code TEXT NOT NULL
);

CREATE TABLE books_languages_link (
    id INTEGER PRIMARY KEY,
    book INTEGER NOT NULL,
    lang_code INTEGER NOT NULL,
    item_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(book, lang_code)
);
```

Language codes are stored as references (foreign keys) to the `languages` table, not as direct text columns. When querying languages:
- Join `books_languages_link` with `languages` to fetch language codes
- Use `ORDER BY item_order ASC` to maintain language order
- Handle cases where books have no associated languages

## Testing
- Unit tests in each module (models, error, schema, queries)
- Integration tests in `tests/integration_tests.rs` with real SQLite databases
- All tests must create temporary databases; no file I/O to real libraries
- Verify both presence and absence of optional relations

## Build & Test
```
cargo check -p calibre_db    # Verify compilation
cargo fmt                     # Format code (or cargo fmt -p calibre_db)
cargo clippy -p calibre_db   # Lint (or run from calibre_db directory)
cargo test -p calibre_db     # Run all tests
cargo test -p calibre_db --lib    # Unit tests only
cargo test -p calibre_db --test integration_tests  # Integration tests
```

Alternatively, run from the workspace root or use `--workspace` to check all crates:
```
cargo check --workspace
cargo test --workspace
cargo clippy --workspace
```

## Troubleshooting

### Schema Verification
If you encounter unexpected column errors or schema-related issues, ask the user for their Calibre database path, then verify the actual database schema with:

```bash
sqlite3 <USER_PROVIDED_DB_PATH> ".schema TABLE_NAME"
```

Replace `<USER_PROVIDED_DB_PATH>` with the user's actual Calibre `metadata.db` file path and `TABLE_NAME` with the table being investigated (e.g., `books_languages_link`, `books`, `authors`).

### Common Issues

**"no such column" errors**: The database schema may differ from expectations. Request the user's database path and use the schema verification command above to inspect the actual column names and structure.

**Language code retrieval failures**: Calibre uses a foreign key relationship between `books_languages_link` and `languages` tables. Ask the user for their database path and verify both table schemas:

```bash
sqlite3 <USER_PROVIDED_DB_PATH> ".schema books_languages_link"
sqlite3 <USER_PROVIDED_DB_PATH> ".schema languages"
```

Ensure queries properly join these tables and handle cases where books have no associated languages.
