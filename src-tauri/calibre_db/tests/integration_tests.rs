#[cfg(test)]
mod integration_tests {
    use calibre_db::CalibreDatabase;
    use rusqlite::Connection;
    use tempfile::NamedTempFile;

    fn create_test_database() -> (String, NamedTempFile) {
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        let path = temp_file.path().to_path_buf();
        let path_str = path.to_string_lossy().to_string();

        let conn = Connection::open(&path).expect("Failed to open database");

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
        )
        .expect("Failed to create books table");

        conn.execute(
            "INSERT INTO books (id, title, sort, timestamp, pubdate, series_index, author_sort, isbn, lccn, path, has_cover)
             VALUES
             (1, 'The Rust Programming Language', 'rust programming language, the', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', 1.0, 'Klabnik, Steve', '978-1491927281', '', '/library/book1', 1),
             (2, 'Zero to Production in Rust', 'zero to production in rust', '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z', 1.0, 'Raita, Luca', '978-1617738586', '', '/library/book2', 0)",
            [],
        )
        .expect("Failed to insert books");

        conn.execute(
            "CREATE TABLE authors (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                sort TEXT
            )",
            [],
        )
        .expect("Failed to create authors table");

        conn.execute(
            "INSERT INTO authors (id, name, sort) VALUES
             (1, 'Steve Klabnik', 'Klabnik, Steve'),
             (2, 'Luca Raita', 'Raita, Luca')",
            [],
        )
        .expect("Failed to insert authors");

        conn.execute(
            "CREATE TABLE books_authors_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                author INTEGER
            )",
            [],
        )
        .expect("Failed to create books_authors_link table");

        conn.execute(
            "INSERT INTO books_authors_link (book, author) VALUES
             (1, 1),
             (2, 2)",
            [],
        )
        .expect("Failed to insert book-author links");

        conn.execute(
            "CREATE TABLE publishers (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )",
            [],
        )
        .expect("Failed to create publishers table");

        conn.execute(
            "INSERT INTO publishers (id, name) VALUES
             (1, 'No Starch Press'),
             (2, 'Manning')",
            [],
        )
        .expect("Failed to insert publishers");

        conn.execute(
            "CREATE TABLE books_publishers_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                publisher INTEGER
            )",
            [],
        )
        .expect("Failed to create books_publishers_link table");

        conn.execute(
            "INSERT INTO books_publishers_link (book, publisher) VALUES
             (1, 1),
             (2, 2)",
            [],
        )
        .expect("Failed to insert book-publisher links");

        conn.execute(
            "CREATE TABLE tags (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )",
            [],
        )
        .expect("Failed to create tags table");

        conn.execute(
            "INSERT INTO tags (id, name) VALUES
             (1, 'Programming'),
             (2, 'Rust'),
             (3, 'Systems'),
             (4, 'Web')",
            [],
        )
        .expect("Failed to insert tags");

        conn.execute(
            "CREATE TABLE books_tags_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                tag INTEGER
            )",
            [],
        )
        .expect("Failed to create books_tags_link table");

        conn.execute(
            "INSERT INTO books_tags_link (book, tag) VALUES
             (1, 1), (1, 2), (1, 3),
             (2, 1), (2, 2), (2, 4)",
            [],
        )
        .expect("Failed to insert book-tag links");

        conn.execute(
            "CREATE TABLE series (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )",
            [],
        )
        .expect("Failed to create series table");

        conn.execute(
            "INSERT INTO series (id, name) VALUES
             (1, 'Official Rust Book')",
            [],
        )
        .expect("Failed to insert series");

        conn.execute(
            "CREATE TABLE books_series_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                series INTEGER
            )",
            [],
        )
        .expect("Failed to create books_series_link table");

        conn.execute(
            "INSERT INTO books_series_link (book, series) VALUES (1, 1)",
            [],
        )
        .expect("Failed to insert book-series links");

        conn.execute(
            "CREATE TABLE comments (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                text TEXT
            )",
            [],
        )
        .expect("Failed to create comments table");

        conn.execute(
            "INSERT INTO comments (book, text) VALUES
             (1, 'Essential reading for Rust developers'),
             (2, 'Great practical guide for production systems')",
            [],
        )
        .expect("Failed to insert comments");

        conn.execute(
            "CREATE TABLE ratings (
                id INTEGER PRIMARY KEY,
                rating INTEGER
            )",
            [],
        )
        .expect("Failed to create ratings table");

        conn.execute(
            "INSERT INTO ratings (id, rating) VALUES
             (1, 10),
             (2, 8)",
            [],
        )
        .expect("Failed to insert ratings");

        conn.execute(
            "CREATE TABLE books_ratings_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                rating INTEGER
            )",
            [],
        )
        .expect("Failed to create books_ratings_link table");

        conn.execute(
            "INSERT INTO books_ratings_link (book, rating) VALUES
             (1, 1),
             (2, 2)",
            [],
        )
        .expect("Failed to insert book-rating links");

        conn.execute(
            "CREATE TABLE data (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                format TEXT
            )",
            [],
        )
        .expect("Failed to create data table");

        conn.execute(
            "INSERT INTO data (book, format) VALUES
             (1, 'EPUB'), (1, 'PDF'),
             (2, 'EPUB'), (2, 'MOBI')",
            [],
        )
        .expect("Failed to insert formats");

        conn.execute(
            "CREATE TABLE identifiers (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                type TEXT,
                val TEXT
            )",
            [],
        )
        .expect("Failed to create identifiers table");

        conn.execute(
            "INSERT INTO identifiers (book, type, val) VALUES
             (1, 'isbn', '978-1491927281'),
             (2, 'isbn', '978-1617738586')",
            [],
        )
        .expect("Failed to insert identifiers");

        conn.execute(
            "CREATE TABLE languages (
                id INTEGER PRIMARY KEY,
                lang_code TEXT NOT NULL
            )",
            [],
        )
        .expect("Failed to create languages table");

        conn.execute(
            "INSERT INTO languages (id, lang_code) VALUES
             (1, 'en'),
             (2, 'es')",
            [],
        )
        .expect("Failed to insert languages");

        conn.execute(
            "CREATE TABLE books_languages_link (
                id INTEGER PRIMARY KEY,
                book INTEGER,
                lang_code INTEGER,
                item_order INTEGER DEFAULT 0
            )",
            [],
        )
        .expect("Failed to create books_languages_link table");

        conn.execute(
            "INSERT INTO books_languages_link (book, lang_code, item_order) VALUES
             (1, 1, 0), (1, 2, 1),
             (2, 1, 0)",
            [],
        )
        .expect("Failed to insert book-language links");

        drop(conn);

        (path_str, temp_file)
    }

    #[test]
    fn test_open_database() {
        let (path, _temp) = create_test_database();
        let result = CalibreDatabase::open(&path);
        assert!(result.is_ok());
    }

    #[test]
    fn test_get_single_book() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");
        assert_eq!(book.id, 1);
        assert_eq!(book.title, "The Rust Programming Language");
        assert_eq!(book.isbn, "978-1491927281");
    }

    #[test]
    fn test_get_book_with_authors() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");
        assert_eq!(book.authors.len(), 1);
        assert_eq!(book.authors[0].name, "Steve Klabnik");
        assert_eq!(book.authors[0].sort, "Klabnik, Steve");
    }

    #[test]
    fn test_get_book_with_publishers() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");
        assert_eq!(book.publishers.len(), 1);
        assert_eq!(book.publishers[0], "No Starch Press");
    }

    #[test]
    fn test_get_book_with_tags() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");
        assert_eq!(book.tags.len(), 3);
        assert_eq!(book.tags[0].name, "Programming");
        assert_eq!(book.tags[1].name, "Rust");
        assert_eq!(book.tags[2].name, "Systems");
    }

    #[test]
    fn test_get_book_with_series() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");
        assert!(book.series.is_some());
        assert_eq!(book.series.unwrap().name, "Official Rust Book");
    }

    #[test]
    fn test_get_book_with_comments() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");
        assert!(book.comments.is_some());
        assert_eq!(
            book.comments.unwrap(),
            "Essential reading for Rust developers"
        );
    }

    #[test]
    fn test_get_book_with_rating() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");
        assert!(book.rating.is_some());
        assert_eq!(book.rating.unwrap(), 5);
    }

    #[test]
    fn test_get_book_with_formats() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");
        assert_eq!(book.formats.len(), 2);
        assert!(book.formats.contains(&"EPUB".to_string()));
        assert!(book.formats.contains(&"PDF".to_string()));
    }

    #[test]
    fn test_get_book_with_identifiers() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");
        assert_eq!(book.identifiers.len(), 1);
        assert_eq!(book.identifiers[0].kind, "isbn");
        assert_eq!(book.identifiers[0].val, "978-1491927281");
    }

    #[test]
    fn test_get_book_with_languages() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");
        assert_eq!(book.languages.len(), 2);
        assert!(book.languages.contains(&"en".to_string()));
        assert!(book.languages.contains(&"es".to_string()));
    }

    #[test]
    fn test_get_all_books() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let books = db.all_books().expect("Failed to get all books");
        assert_eq!(books.len(), 2);

        assert_eq!(books[0].id, 1);
        assert_eq!(books[1].id, 2);
    }

    #[test]
    fn test_all_books_ordered_by_sort() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let books = db.all_books().expect("Failed to get all books");
        assert_eq!(books.len(), 2);
        assert_eq!(books[0].sort, "rust programming language, the");
        assert_eq!(books[1].sort, "zero to production in rust");
    }

    #[test]
    fn test_get_book_nonexistent() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let result = db.get_book(9999);
        assert!(result.is_err());
    }

    #[test]
    fn test_book_without_series() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(2).expect("Failed to get book");
        assert!(book.series.is_none());
    }

    #[test]
    fn test_multiple_authors_per_book() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let conn = Connection::open(&path).expect("Failed to open database for modification");

        conn.execute(
            "INSERT INTO authors (id, name, sort) VALUES (3, 'Co Author', 'Author, Co')",
            [],
        )
        .expect("Failed to insert author");

        conn.execute(
            "INSERT INTO books_authors_link (book, author) VALUES (1, 3)",
            [],
        )
        .expect("Failed to insert author link");

        drop(conn);

        let book = db.get_book(1).expect("Failed to get book");
        assert_eq!(book.authors.len(), 2);
    }

    #[test]
    fn test_book_complete_metadata() {
        let (path, _temp) = create_test_database();
        let db = CalibreDatabase::open(&path).expect("Failed to open database");

        let book = db.get_book(1).expect("Failed to get book");

        assert_eq!(book.title, "The Rust Programming Language");
        assert_eq!(book.author_sort, "Klabnik, Steve");
        assert_eq!(book.series_index, 1.0);
        assert!(book.has_cover);
        assert_eq!(book.path, "/library/book1");
        assert!(!book.isbn.is_empty());
        assert_eq!(book.authors.len(), 1);
        assert_eq!(book.publishers.len(), 1);
        assert_eq!(book.tags.len(), 3);
        assert!(book.series.is_some());
        assert!(book.comments.is_some());
        assert!(book.rating.is_some());
        assert_eq!(book.formats.len(), 2);
        assert!(!book.identifiers.is_empty());
        assert_eq!(book.languages.len(), 2);
    }
}
