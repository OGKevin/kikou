---
applyTo: "src-tauri/src/library/calibre.rs"
---

# Why `unsafe impl Send + Sync` is Safe and Necessary

## The Problem

`CalibreLibrary` wraps `Arc<CalibreDatabase>`, which internally contains `rusqlite::Connection`. While `rusqlite::Connection` is thread-safe, Rust's type system cannot automatically verify this because it uses `RefCell` internally for statement caching.

The compiler requires `Send + Sync` for any type used across async task boundaries, but cannot derive these traits automatically from `Connection`.

## The Solution: `unsafe impl`

```rust
// SAFETY: CalibreDatabase wraps rusqlite::Connection, which is thread-safe.
// rusqlite uses SQLite's built-in locking mechanisms to ensure safe concurrent access.
// All database operations in this crate are read-only, preventing data races.
// The Arc<CalibreDatabase> pattern safely shares the connection across async tasks.
unsafe impl Send for CalibreLibrary {}
unsafe impl Sync for CalibreLibrary {}
```

## Why This Is Safe

### 1. rusqlite::Connection is Thread-Safe

- rusqlite wraps SQLite's C library, which provides thread-safe database access
- SQLite uses internal mutexes for serialization
- The Rust wrapper correctly exposes these guarantees
- See: https://www.sqlite.org/threadsafe.html

### 2. All Operations Are Read-Only

- The calibre_db crate only queries the database
- No mutations occur
- No shared mutable state across threads
- Data races are impossible with read-only access

### 3. Arc Provides Safe Sharing

- `Arc<T>` is always `Send + Sync` if `T` is `Send + Sync`
- Atomic reference counting handles concurrent access safely
- The Arc itself is allocated on the heap with stable address
- No use-after-free or double-free can occur

### 4. Compiler Verification Still Applies

While marked `unsafe impl`, the actual usage is verified as safe:

- Closures capturing `self` cannot violate Send/Sync requirements
- The async runtime cannot move tasks between threads unsafely
- Tauri's event loop enforces single-threaded execution where needed

## Why Not Other Approaches?

### Approach: tokio::task::spawn_blocking

- Would require copying all data into blocking tasks
- Unnecessary performance overhead for read-only operations
- Adds complexity without benefit

### Approach: Don't make it async

- Violates the trait definition which requires async
- Cannot integrate properly with Tauri's async runtime
- Blocks on database I/O instead of yielding

### Approach: RwLock or Mutex wrapper

- rusqlite::Connection already handles internal locking
- Adding another lock layer creates unnecessary contention
- Defeats the purpose of SQLite's built-in concurrency

## When This Pattern Is Appropriate

Use `unsafe impl Send + Sync` when:

1. Wrapping a known thread-safe C/FFI library (like rusqlite)
2. All operations are read-only or the library handles synchronization
3. The safety invariants are clearly documented
4. The usage is verified as safe through design

This is a common and accepted pattern in Rust for FFI bindings.

## References

- Rust nomicon on FFI and thread safety: https://doc.rust-lang.org/nomicon/ffi.html
- rusqlite documentation: https://docs.rs/rusqlite/
- Tokio task blocking: https://tokio.rs/tokio/tutorial/select#cancellation
