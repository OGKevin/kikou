use crate::ReadOnlyDatabase;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Book {
    pub id: u32,
    pub title: String,
    pub sort: String,
    pub timestamp: DateTime<Utc>,
    pub pubdate: DateTime<Utc>,
    pub series_index: f32,
    pub author_sort: String,
    pub isbn: String,
    pub lccn: String,
    pub path: String,
    pub has_cover: bool,
    pub authors: Vec<Author>,
    pub publishers: Vec<String>,
    pub tags: Vec<Tag>,
    pub series: Option<Series>,
    pub comments: Option<String>,
    pub rating: Option<u8>,
    pub formats: Vec<String>,
    pub identifiers: Vec<Identifier>,
    pub languages: Vec<String>,
}

impl Book {
    /// Creates a new book builder with the given ID, title, and path.
    ///
    /// Returns `BookBuilder<'static>` to allow building without a database reference.
    /// The builder can later be configured with a database via `with_db()` to enable
    /// automatic relation fetching during `build()`.
    ///
    /// # Examples
    ///
    /// Building without a database (no relation fetching):
    /// ```
    /// use calibre_db::Book;
    /// let book = Book::builder(1, "Title".into(), "/path".into())
    ///     .sort("book, title".into())
    ///     .build()
    ///     .unwrap();
    /// assert_eq!(book.id, 1);
    /// assert_eq!(book.title, "Title");
    /// ```
    ///
    /// Building with a database to enable relation fetching:
    /// ```ignore
    /// use calibre_db::Book;
    /// let book = Book::builder(1, "Title".into(), "/path".into())
    ///     .with_db(&db)
    ///     .fetch_all()
    ///     .build()?;
    /// ```
    ///
    /// # Lifetime Design
    /// The function returns `BookBuilder<'static>` instead of `BookBuilder<'a>` because
    /// initially the builder has no database reference (db is `None`). When `with_db()`
    /// is called later, the lifetime constraint becomes bound to the database reference's
    /// lifetime. This design allows building complete books without a database while still
    /// supporting optional database-aware relation fetching.
    pub fn builder(id: u32, title: String, path: String) -> BookBuilder<'static> {
        BookBuilder {
            id,
            title,
            path,
            sort: String::new(),
            timestamp: Utc::now(),
            pubdate: Utc::now(),
            series_index: 0.0,
            author_sort: String::new(),
            isbn: String::new(),
            lccn: String::new(),
            has_cover: false,
            authors: Vec::new(),
            publishers: Vec::new(),
            tags: Vec::new(),
            series: None,
            comments: None,
            rating: None,
            formats: Vec::new(),
            identifiers: Vec::new(),
            languages: Vec::new(),
            fetch_authors: false,
            fetch_publishers: false,
            fetch_tags: false,
            fetch_series: false,
            fetch_comments: false,
            fetch_rating: false,
            fetch_formats: false,
            fetch_identifiers: false,
            fetch_languages: false,
            db: None,
        }
    }
}

pub struct BookBuilder<'a> {
    id: u32,
    title: String,
    path: String,
    sort: String,
    timestamp: DateTime<Utc>,
    pubdate: DateTime<Utc>,
    series_index: f32,
    author_sort: String,
    isbn: String,
    lccn: String,
    has_cover: bool,
    authors: Vec<Author>,
    publishers: Vec<String>,
    tags: Vec<Tag>,
    series: Option<Series>,
    comments: Option<String>,
    rating: Option<u8>,
    formats: Vec<String>,
    identifiers: Vec<Identifier>,
    languages: Vec<String>,
    fetch_authors: bool,
    fetch_publishers: bool,
    fetch_tags: bool,
    fetch_series: bool,
    fetch_comments: bool,
    fetch_rating: bool,
    fetch_formats: bool,
    fetch_identifiers: bool,
    fetch_languages: bool,
    db: Option<&'a dyn ReadOnlyDatabase>,
}

impl<'a> BookBuilder<'a> {
    pub fn sort(mut self, sort: String) -> Self {
        self.sort = sort;
        self
    }

    pub fn timestamp(mut self, timestamp: DateTime<Utc>) -> Self {
        self.timestamp = timestamp;
        self
    }

    pub fn pubdate(mut self, pubdate: DateTime<Utc>) -> Self {
        self.pubdate = pubdate;
        self
    }

    pub fn series_index(mut self, series_index: f32) -> Self {
        self.series_index = series_index;
        self
    }

    pub fn author_sort(mut self, author_sort: String) -> Self {
        self.author_sort = author_sort;
        self
    }

    pub fn isbn(mut self, isbn: String) -> Self {
        self.isbn = isbn;
        self
    }

    pub fn lccn(mut self, lccn: String) -> Self {
        self.lccn = lccn;
        self
    }

    pub fn has_cover(mut self, has_cover: bool) -> Self {
        self.has_cover = has_cover;
        self
    }

    pub fn authors(mut self, authors: Vec<Author>) -> Self {
        self.authors = authors;
        self
    }

    pub fn publishers(mut self, publishers: Vec<String>) -> Self {
        self.publishers = publishers;
        self
    }

    pub fn tags(mut self, tags: Vec<Tag>) -> Self {
        self.tags = tags;
        self
    }

    pub fn series(mut self, series: Option<Series>) -> Self {
        self.series = series;
        self
    }

    pub fn comments(mut self, comments: Option<String>) -> Self {
        self.comments = comments;
        self
    }

    pub fn rating(mut self, rating: Option<u8>) -> Self {
        self.rating = rating;
        self
    }

    pub fn formats(mut self, formats: Vec<String>) -> Self {
        self.formats = formats;
        self
    }

    pub fn identifiers(mut self, identifiers: Vec<Identifier>) -> Self {
        self.identifiers = identifiers;
        self
    }

    pub fn languages(mut self, languages: Vec<String>) -> Self {
        self.languages = languages;
        self
    }

    pub fn with_db(mut self, db: &'a dyn ReadOnlyDatabase) -> Self {
        self.db = Some(db);
        self
    }

    pub fn fetch_authors(mut self, fetch: bool) -> Self {
        self.fetch_authors = fetch;
        self
    }

    pub fn fetch_publishers(mut self, fetch: bool) -> Self {
        self.fetch_publishers = fetch;
        self
    }

    pub fn fetch_tags(mut self, fetch: bool) -> Self {
        self.fetch_tags = fetch;
        self
    }

    pub fn fetch_series(mut self, fetch: bool) -> Self {
        self.fetch_series = fetch;
        self
    }

    pub fn fetch_comments(mut self, fetch: bool) -> Self {
        self.fetch_comments = fetch;
        self
    }

    pub fn fetch_rating(mut self, fetch: bool) -> Self {
        self.fetch_rating = fetch;
        self
    }

    pub fn fetch_formats(mut self, fetch: bool) -> Self {
        self.fetch_formats = fetch;
        self
    }

    pub fn fetch_identifiers(mut self, fetch: bool) -> Self {
        self.fetch_identifiers = fetch;
        self
    }

    pub fn fetch_languages(mut self, fetch: bool) -> Self {
        self.fetch_languages = fetch;
        self
    }

    pub fn fetch_all(mut self) -> Self {
        self.fetch_authors = true;
        self.fetch_publishers = true;
        self.fetch_tags = true;
        self.fetch_series = true;
        self.fetch_comments = true;
        self.fetch_rating = true;
        self.fetch_formats = true;
        self.fetch_identifiers = true;
        self.fetch_languages = true;
        self
    }

    pub fn build(mut self) -> crate::error::Result<Book> {
        if let Some(db) = self.db {
            // Sequential queries are used here instead of a single complex JOIN.
            // This implements a pragmatic trade-off between performance and maintainability.
            //
            // Why sequential queries instead of a single complex JOIN?
            //
            // 1. **Cartesian Product Complexity**: Multiple many-to-many JOINs create a cartesian
            //    product that requires complex aggregation logic to deduplicate results.
            // 2. **Maintainability**: Sequential targeted queries are simpler to understand and debug.
            // 3. **Performance**: In practice, sequential queries perform well due to SQLite's
            //    query optimization and caching. The number of queries is fixed (at most 9),
            //    not dependent on result set size.
            //
            // When to Consider a Single Query Approach:
            // If performance profiling shows N+1 query overhead is significant, consider:
            // - Using UNION queries to avoid cartesian products
            // - Building a smarter aggregation layer
            // - Caching frequently accessed relations
            if self.fetch_authors {
                self.authors = db.fetch_book_authors(self.id)?;
            }
            if self.fetch_publishers {
                self.publishers = db.fetch_book_publishers(self.id)?;
            }
            if self.fetch_tags {
                self.tags = db.fetch_book_tags(self.id)?;
            }
            if self.fetch_series {
                self.series = db.fetch_book_series(self.id)?;
            }
            if self.fetch_comments {
                self.comments = db.fetch_book_comments(self.id)?;
            }
            if self.fetch_rating {
                self.rating = db.fetch_book_rating(self.id)?;
            }
            if self.fetch_formats {
                self.formats = db.fetch_book_formats(self.id)?;
            }
            if self.fetch_identifiers {
                self.identifiers = db.fetch_book_identifiers(self.id)?;
            }
            if self.fetch_languages {
                self.languages = db.fetch_book_languages(self.id)?;
            }
        }

        Ok(Book {
            id: self.id,
            title: self.title,
            path: self.path,
            sort: self.sort,
            timestamp: self.timestamp,
            pubdate: self.pubdate,
            series_index: self.series_index,
            author_sort: self.author_sort,
            isbn: self.isbn,
            lccn: self.lccn,
            has_cover: self.has_cover,
            authors: self.authors,
            publishers: self.publishers,
            tags: self.tags,
            series: self.series,
            comments: self.comments,
            rating: self.rating,
            formats: self.formats,
            identifiers: self.identifiers,
            languages: self.languages,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Author {
    pub id: u32,
    pub name: String,
    pub sort: String,
    pub link: Option<String>,
}

impl Author {
    pub fn new(id: u32, name: String, sort: String) -> Self {
        Author {
            id,
            name,
            sort,
            link: None,
        }
    }

    pub fn with_link(mut self, link: String) -> Self {
        self.link = Some(link);
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Series {
    pub id: u32,
    pub name: String,
}

impl Series {
    pub fn new(id: u32, name: String) -> Self {
        Series { id, name }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Tag {
    pub id: u32,
    pub name: String,
}

impl Tag {
    pub fn new(id: u32, name: String) -> Self {
        Tag { id, name }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Identifier {
    pub book_id: u32,
    pub kind: String,
    pub val: String,
}

impl Identifier {
    pub fn new(book_id: u32, kind: String, val: String) -> Self {
        Identifier { book_id, kind, val }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookMetadata {
    pub title: String,
    pub authors: Vec<String>,
    pub publisher: Option<String>,
    pub pubdate: Option<DateTime<Utc>>,
    pub series: Option<String>,
    pub series_index: Option<f32>,
    pub tags: Vec<String>,
    pub comments: Option<String>,
    pub rating: Option<u8>,
    pub isbn: Option<String>,
    pub languages: Vec<String>,
}

impl BookMetadata {
    pub fn from_book(book: &Book) -> Self {
        BookMetadata {
            title: book.title.clone(),
            authors: book.authors.iter().map(|a| a.name.clone()).collect(),
            publisher: book.publishers.first().cloned(),
            pubdate: Some(book.pubdate),
            series: book.series.as_ref().map(|s| s.name.clone()),
            series_index: if book.series.is_some() {
                Some(book.series_index)
            } else {
                None
            },
            tags: book.tags.iter().map(|t| t.name.clone()).collect(),
            comments: book.comments.clone(),
            rating: book.rating,
            isbn: if book.isbn.is_empty() {
                None
            } else {
                Some(book.isbn.clone())
            },
            languages: book.languages.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_book_creation() {
        let book = Book::builder(1, "Test Book".to_string(), "/path/to/book".to_string())
            .sort("book, test".to_string())
            .has_cover(true)
            .build()
            .unwrap();

        assert_eq!(book.id, 1);
        assert_eq!(book.title, "Test Book");
        assert_eq!(book.path, "/path/to/book");
        assert!(book.authors.is_empty());
    }

    #[test]
    fn test_book_builder_chain() {
        let authors = vec![Author::new(
            1,
            "Test Author".to_string(),
            "Author, Test".to_string(),
        )];
        let tags = vec![Tag::new(1, "Fiction".to_string())];

        let book = Book::builder(1, "Test Book".to_string(), "/path/to/book".to_string())
            .sort("book, test".to_string())
            .authors(authors)
            .tags(tags)
            .has_cover(true)
            .build()
            .unwrap();

        assert_eq!(book.authors.len(), 1);
        assert_eq!(book.tags.len(), 1);
    }

    #[test]
    fn test_author_creation() {
        let author = Author::new(1, "John Doe".to_string(), "Doe, John".to_string());
        assert_eq!(author.name, "John Doe");
        assert_eq!(author.sort, "Doe, John");
        assert!(author.link.is_none());
    }

    #[test]
    fn test_series_creation() {
        let series = Series::new(1, "Test Series".to_string());
        assert_eq!(series.name, "Test Series");
    }

    #[test]
    fn test_tag_creation() {
        let tag = Tag::new(1, "Science Fiction".to_string());
        assert_eq!(tag.name, "Science Fiction");
    }

    #[test]
    fn test_identifier_creation() {
        let id = Identifier::new(1, "isbn".to_string(), "123-456-789".to_string());
        assert_eq!(id.kind, "isbn");
        assert_eq!(id.val, "123-456-789");
    }

    #[test]
    fn test_book_metadata_from_book() {
        let authors = vec![Author::new(
            1,
            "Test Author".to_string(),
            "Author, Test".to_string(),
        )];
        let tags = vec![Tag::new(1, "Fiction".to_string())];
        let series = Some(Series::new(1, "Test Series".to_string()));

        let book = Book::builder(1, "Test Book".to_string(), "/path/to/book".to_string())
            .sort("book, test".to_string())
            .series_index(1.5)
            .isbn("123-456-789".to_string())
            .authors(authors)
            .tags(tags)
            .series(series)
            .rating(Some(4))
            .has_cover(true)
            .build()
            .unwrap();

        let metadata = BookMetadata::from_book(&book);
        assert_eq!(metadata.title, "Test Book");
        assert_eq!(metadata.authors.len(), 1);
        assert_eq!(metadata.rating, Some(4));
        assert_eq!(metadata.series, Some("Test Series".to_string()));
    }
}
