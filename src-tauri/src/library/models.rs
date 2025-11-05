use serde::{Deserialize, Serialize};

/// Library-agnostic Book structure that can be returned to the frontend.
/// Only includes fields that are actually used by the frontend.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Book {
    pub id: u32,
    pub title: String,
    pub pubdate: String,
    pub isbn: String,
    pub authors: Vec<Author>,
    pub publishers: Vec<String>,
    pub tags: Vec<Tag>,
    pub series: Option<Series>,
    pub rating: Option<u8>,
    pub formats: Vec<String>,
    pub languages: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Author {
    pub id: u32,
    pub name: String,
    pub sort: String,
    pub link: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Series {
    pub id: u32,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Tag {
    pub id: u32,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Identifier {
    pub book_id: u32,
    pub kind: String,
    pub val: String,
}

impl From<calibre_db::Book> for Book {
    fn from(book: calibre_db::Book) -> Self {
        Book {
            id: book.id,
            title: book.title,
            pubdate: book.pubdate.to_rfc3339(),
            isbn: book.isbn,
            authors: book.authors.into_iter().map(Author::from).collect(),
            publishers: book.publishers,
            tags: book.tags.into_iter().map(Tag::from).collect(),
            series: book.series.map(Series::from),
            rating: book.rating,
            formats: book.formats,
            languages: book.languages,
        }
    }
}

impl From<calibre_db::Author> for Author {
    fn from(author: calibre_db::Author) -> Self {
        Author {
            id: author.id,
            name: author.name,
            sort: author.sort,
            link: author.link,
        }
    }
}

impl From<calibre_db::Series> for Series {
    fn from(series: calibre_db::Series) -> Self {
        Series {
            id: series.id,
            name: series.name,
        }
    }
}

impl From<calibre_db::Tag> for Tag {
    fn from(tag: calibre_db::Tag) -> Self {
        Tag {
            id: tag.id,
            name: tag.name,
        }
    }
}

impl From<calibre_db::Identifier> for Identifier {
    fn from(identifier: calibre_db::Identifier) -> Self {
        Identifier {
            book_id: identifier.book_id,
            kind: identifier.kind,
            val: identifier.val,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_author_conversion() {
        let calibre_author = calibre_db::Author {
            id: 1,
            name: "Test Author".to_string(),
            sort: "Author, Test".to_string(),
            link: Some("http://example.com".to_string()),
        };

        let agnostic_author: Author = calibre_author.into();

        assert_eq!(agnostic_author.id, 1);
        assert_eq!(agnostic_author.name, "Test Author");
        assert_eq!(agnostic_author.sort, "Author, Test");
        assert_eq!(agnostic_author.link, Some("http://example.com".to_string()));
    }

    #[test]
    fn test_series_conversion() {
        let calibre_series = calibre_db::Series {
            id: 5,
            name: "Test Series".to_string(),
        };

        let agnostic_series: Series = calibre_series.into();

        assert_eq!(agnostic_series.id, 5);
        assert_eq!(agnostic_series.name, "Test Series");
    }

    #[test]
    fn test_tag_conversion() {
        let calibre_tag = calibre_db::Tag {
            id: 3,
            name: "Fiction".to_string(),
        };

        let agnostic_tag: Tag = calibre_tag.into();

        assert_eq!(agnostic_tag.id, 3);
        assert_eq!(agnostic_tag.name, "Fiction");
    }

    #[test]
    fn test_identifier_conversion() {
        let calibre_identifier = calibre_db::Identifier {
            book_id: 10,
            kind: "isbn".to_string(),
            val: "1234567890".to_string(),
        };

        let agnostic_identifier: Identifier = calibre_identifier.into();

        assert_eq!(agnostic_identifier.book_id, 10);
        assert_eq!(agnostic_identifier.kind, "isbn");
        assert_eq!(agnostic_identifier.val, "1234567890");
    }
}
