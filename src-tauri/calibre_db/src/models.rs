use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

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
    pub fn new(
        id: u32,
        title: String,
        sort: String,
        timestamp: DateTime<Utc>,
        pubdate: DateTime<Utc>,
        series_index: f32,
        author_sort: String,
        isbn: String,
        lccn: String,
        path: String,
        has_cover: bool,
    ) -> Self {
        Book {
            id,
            title,
            sort,
            timestamp,
            pubdate,
            series_index,
            author_sort,
            isbn,
            lccn,
            path,
            has_cover,
            authors: Vec::new(),
            publishers: Vec::new(),
            tags: Vec::new(),
            series: None,
            comments: None,
            rating: None,
            formats: Vec::new(),
            identifiers: Vec::new(),
            languages: Vec::new(),
        }
    }

    pub fn with_authors(mut self, authors: Vec<Author>) -> Self {
        self.authors = authors;
        self
    }

    pub fn with_publishers(mut self, publishers: Vec<String>) -> Self {
        self.publishers = publishers;
        self
    }

    pub fn with_tags(mut self, tags: Vec<Tag>) -> Self {
        self.tags = tags;
        self
    }

    pub fn with_series(mut self, series: Option<Series>) -> Self {
        self.series = series;
        self
    }

    pub fn with_comments(mut self, comments: Option<String>) -> Self {
        self.comments = comments;
        self
    }

    pub fn with_rating(mut self, rating: Option<u8>) -> Self {
        self.rating = rating;
        self
    }

    pub fn with_formats(mut self, formats: Vec<String>) -> Self {
        self.formats = formats;
        self
    }

    pub fn with_identifiers(mut self, identifiers: Vec<Identifier>) -> Self {
        self.identifiers = identifiers;
        self
    }

    pub fn with_languages(mut self, languages: Vec<String>) -> Self {
        self.languages = languages;
        self
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
        let now = Utc::now();
        let book = Book::new(
            1,
            "Test Book".to_string(),
            "book, test".to_string(),
            now,
            now,
            1.0,
            "Author, Test".to_string(),
            "123-456-789".to_string(),
            "".to_string(),
            "/path/to/book".to_string(),
            true,
        );

        assert_eq!(book.id, 1);
        assert_eq!(book.title, "Test Book");
        assert!(book.authors.is_empty());
    }

    #[test]
    fn test_book_builder_chain() {
        let now = Utc::now();
        let authors = vec![Author::new(1, "Test Author".to_string(), "Author, Test".to_string())];
        let tags = vec![Tag::new(1, "Fiction".to_string())];

        let book = Book::new(
            1,
            "Test Book".to_string(),
            "book, test".to_string(),
            now,
            now,
            1.0,
            "Author, Test".to_string(),
            "123-456-789".to_string(),
            "".to_string(),
            "/path/to/book".to_string(),
            true,
        )
        .with_authors(authors)
        .with_tags(tags);

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
        let now = Utc::now();
        let authors = vec![Author::new(1, "Test Author".to_string(), "Author, Test".to_string())];
        let tags = vec![Tag::new(1, "Fiction".to_string())];
        let series = Some(Series::new(1, "Test Series".to_string()));

        let book = Book::new(
            1,
            "Test Book".to_string(),
            "book, test".to_string(),
            now,
            now,
            1.5,
            "Author, Test".to_string(),
            "123-456-789".to_string(),
            "".to_string(),
            "/path/to/book".to_string(),
            true,
        )
        .with_authors(authors)
        .with_tags(tags)
        .with_series(series)
        .with_rating(Some(4));

        let metadata = BookMetadata::from_book(&book);
        assert_eq!(metadata.title, "Test Book");
        assert_eq!(metadata.authors.len(), 1);
        assert_eq!(metadata.rating, Some(4));
        assert_eq!(metadata.series, Some("Test Series".to_string()));
    }
}