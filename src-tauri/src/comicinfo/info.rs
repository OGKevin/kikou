use super::page::Pages;
use super::types::{
    AgeRating, Manga, YesNo, default_age_rating, default_manga, default_minus_one, default_yes_no,
    is_minus_one, is_unknown_age_rating, is_unknown_manga, is_unknown_yes_no, is_zero_i32,
};
use crate::archive::types::{ErrorResponse, ErrorResponseType, ToErrorResponse};
use quick_xml::events::Event;
use quick_xml::{Reader, Writer};
use serde::{Deserialize, Serialize};
use std::fmt;
use std::io::Cursor;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ComicInfo {
    #[serde(rename = "Title", default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(rename = "Series", default, skip_serializing_if = "Option::is_none")]
    pub series: Option<String>,
    #[serde(rename = "Number", default, skip_serializing_if = "Option::is_none")]
    pub number: Option<String>,
    #[serde(
        rename = "Count",
        default = "default_minus_one",
        skip_serializing_if = "is_minus_one"
    )]
    pub count: i32,
    #[serde(
        rename = "Volume",
        default = "default_minus_one",
        skip_serializing_if = "is_minus_one"
    )]
    pub volume: i32,
    #[serde(
        rename = "AlternateSeries",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub alternate_series: Option<String>,
    #[serde(
        rename = "AlternateNumber",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub alternate_number: Option<String>,
    #[serde(
        rename = "AlternateCount",
        default = "default_minus_one",
        skip_serializing_if = "is_minus_one"
    )]
    pub alternate_count: i32,
    #[serde(rename = "Summary", default, skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[serde(rename = "Notes", default, skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(
        rename = "Year",
        default = "default_minus_one",
        skip_serializing_if = "is_minus_one"
    )]
    pub year: i32,
    #[serde(
        rename = "Month",
        default = "default_minus_one",
        skip_serializing_if = "is_minus_one"
    )]
    pub month: i32,
    #[serde(
        rename = "Day",
        default = "default_minus_one",
        skip_serializing_if = "is_minus_one"
    )]
    pub day: i32,
    #[serde(rename = "Writer", default, skip_serializing_if = "Option::is_none")]
    pub writer: Option<String>,
    #[serde(rename = "Penciller", default, skip_serializing_if = "Option::is_none")]
    pub penciller: Option<String>,
    #[serde(rename = "Inker", default, skip_serializing_if = "Option::is_none")]
    pub inker: Option<String>,
    #[serde(rename = "Colorist", default, skip_serializing_if = "Option::is_none")]
    pub colorist: Option<String>,
    #[serde(rename = "Letterer", default, skip_serializing_if = "Option::is_none")]
    pub letterer: Option<String>,
    #[serde(
        rename = "CoverArtist",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub cover_artist: Option<String>,
    #[serde(rename = "Editor", default, skip_serializing_if = "Option::is_none")]
    pub editor: Option<String>,
    #[serde(
        rename = "Translator",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub translator: Option<String>,
    #[serde(rename = "Publisher", default, skip_serializing_if = "Option::is_none")]
    pub publisher: Option<String>,
    #[serde(rename = "Imprint", default, skip_serializing_if = "Option::is_none")]
    pub imprint: Option<String>,
    #[serde(rename = "Genre", default, skip_serializing_if = "Option::is_none")]
    pub genre: Option<String>,
    #[serde(rename = "Tags", default, skip_serializing_if = "Option::is_none")]
    pub tags: Option<String>,
    #[serde(rename = "Web", default, skip_serializing_if = "Option::is_none")]
    pub web: Option<String>,
    #[serde(rename = "PageCount", default, skip_serializing_if = "is_zero_i32")]
    pub page_count: i32,
    #[serde(
        rename = "LanguageISO",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub language_iso: Option<String>,
    #[serde(rename = "Format", default, skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    #[serde(
        rename = "BlackAndWhite",
        default = "default_yes_no",
        skip_serializing_if = "is_unknown_yes_no"
    )]
    pub black_and_white: YesNo,
    #[serde(
        rename = "Manga",
        default = "default_manga",
        skip_serializing_if = "is_unknown_manga"
    )]
    pub manga: Manga,
    #[serde(
        rename = "Characters",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub characters: Option<String>,
    #[serde(rename = "Teams", default, skip_serializing_if = "Option::is_none")]
    pub teams: Option<String>,
    #[serde(rename = "Locations", default, skip_serializing_if = "Option::is_none")]
    pub locations: Option<String>,
    #[serde(
        rename = "ScanInformation",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub scan_information: Option<String>,
    #[serde(rename = "StoryArc", default, skip_serializing_if = "Option::is_none")]
    pub story_arc: Option<String>,
    #[serde(
        rename = "StoryArcNumber",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub story_arc_number: Option<String>,
    #[serde(
        rename = "SeriesGroup",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub series_group: Option<String>,
    #[serde(
        rename = "AgeRating",
        default = "default_age_rating",
        skip_serializing_if = "is_unknown_age_rating"
    )]
    pub age_rating: AgeRating,
    #[serde(rename = "Pages", default, skip_serializing_if = "Option::is_none")]
    pub pages: Option<Pages>,
    #[serde(
        rename = "CommunityRating",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub community_rating: Option<f32>,
    #[serde(
        rename = "MainCharacterOrTeam",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub main_character_or_team: Option<String>,
    #[serde(rename = "Review", default, skip_serializing_if = "Option::is_none")]
    pub review: Option<String>,
    #[serde(rename = "GTIN", default, skip_serializing_if = "Option::is_none")]
    pub gtin: Option<String>,
}

impl Default for ComicInfo {
    fn default() -> Self {
        Self {
            title: None,
            series: None,
            number: None,
            count: -1,
            volume: -1,
            alternate_series: None,
            alternate_number: None,
            alternate_count: -1,
            summary: None,
            notes: None,
            year: -1,
            month: -1,
            day: -1,
            writer: None,
            penciller: None,
            inker: None,
            colorist: None,
            letterer: None,
            cover_artist: None,
            editor: None,
            translator: None,
            publisher: None,
            imprint: None,
            genre: None,
            tags: None,
            web: None,
            page_count: 0,
            language_iso: None,
            format: None,
            black_and_white: YesNo::Unknown,
            manga: Manga::Unknown,
            characters: None,
            teams: None,
            locations: None,
            scan_information: None,
            story_arc: None,
            story_arc_number: None,
            series_group: None,
            age_rating: AgeRating::Unknown,
            pages: None,
            community_rating: None,
            main_character_or_team: None,
            review: None,
            gtin: None,
        }
    }
}

#[derive(Debug)]
pub enum ComicInfoParseError {
    EmptyXml,
    TrailingContent,
    NoRootElement,
    QuickXml(quick_xml::Error),
    SerdeXml(serde_xml_rs::Error),
    Utf8(std::str::Utf8Error),
}

impl fmt::Display for ComicInfoParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ComicInfoParseError::EmptyXml => write!(f, "XML is empty"),
            ComicInfoParseError::TrailingContent => {
                write!(f, "Trailing non-whitespace content after root element")
            }
            ComicInfoParseError::NoRootElement => write!(f, "No root element found"),
            ComicInfoParseError::QuickXml(e) => write!(f, "QuickXML error: {}", e),
            ComicInfoParseError::SerdeXml(e) => write!(f, "Serde XML error: {}", e),
            ComicInfoParseError::Utf8(e) => write!(f, "UTF-8 error: {}", e),
        }
    }
}

impl std::error::Error for ComicInfoParseError {}

impl From<quick_xml::Error> for ComicInfoParseError {
    fn from(e: quick_xml::Error) -> Self {
        ComicInfoParseError::QuickXml(e)
    }
}

impl From<serde_xml_rs::Error> for ComicInfoParseError {
    fn from(e: serde_xml_rs::Error) -> Self {
        ComicInfoParseError::SerdeXml(e)
    }
}

impl From<std::str::Utf8Error> for ComicInfoParseError {
    fn from(e: std::str::Utf8Error) -> Self {
        ComicInfoParseError::Utf8(e)
    }
}

impl ComicInfo {
    pub fn parse(xml: &str) -> Result<ComicInfo, ComicInfoParseError> {
        if xml.trim().is_empty() {
            return Err(ComicInfoParseError::EmptyXml);
        }

        let mut reader = Reader::from_str(xml);
        reader.trim_text(true);

        let mut buf = Vec::new();
        let mut depth: usize = 0;
        let mut root_seen_end = false;

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(_)) => {
                    depth = depth.saturating_add(1);
                }
                Ok(Event::Empty(_)) => {
                    if depth == 0 {
                        root_seen_end = true;
                    }
                }
                Ok(Event::End(_)) => {
                    if depth > 0 {
                        depth -= 1;
                        if depth == 0 {
                            root_seen_end = true;
                        }
                    }
                }
                Ok(Event::Text(e)) => {
                    if root_seen_end {
                        let s = std::str::from_utf8(e.as_ref())?;
                        if !s.trim().is_empty() {
                            return Err(ComicInfoParseError::TrailingContent);
                        }
                    }
                }
                Ok(Event::Decl(_)) | Ok(Event::Comment(_)) | Ok(Event::PI(_)) => {}
                Ok(Event::CData(e)) => {
                    if root_seen_end {
                        let s = std::str::from_utf8(e.as_ref())?;
                        if !s.trim().is_empty() {
                            return Err(ComicInfoParseError::TrailingContent);
                        }
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => return Err(ComicInfoParseError::QuickXml(e)),
                _ => {}
            }
            buf.clear();
        }

        if !root_seen_end {
            return Err(ComicInfoParseError::NoRootElement);
        }

        let comic_info: ComicInfo = serde_xml_rs::from_str(xml)?;
        Ok(comic_info)
    }
}

/// Writes a Page event to the XML writer, optionally preceded by a filename comment.
///
/// Extracts the Image attribute from the event, looks up the corresponding filename
/// in the provided map, and writes a comment before the actual event if found.
///
/// # Parameters
/// * `event` - The XML event representing a Page element
/// * `page_filenames` - Map of image indices to filenames
/// * `writer` - The XML writer to output to
/// * `write_fn` - Function that writes the actual event (handles Empty vs Start variants)
fn write_page_event_with_filename_comment<'a, W: std::io::Write>(
    event: &quick_xml::events::BytesStart<'a>,
    page_filenames: &std::collections::HashMap<i32, String>,
    writer: &mut Writer<W>,
    write_fn: impl FnOnce(
        &mut Writer<W>,
        quick_xml::events::BytesStart<'a>,
    ) -> Result<(), quick_xml::Error>,
) -> Result<(), ComicInfoError> {
    let image_idx = event
        .attributes()
        .filter_map(|a| a.ok())
        .find(|attr| attr.key.as_ref() == b"Image")
        .and_then(|attr| {
            std::str::from_utf8(&attr.value)
                .ok()
                .and_then(|s| s.parse::<i32>().ok())
        });

    if let Some(idx) = image_idx {
        if let Some(filename) = page_filenames.get(&idx) {
            let comment = format!(" filename: {} ", filename);
            writer
                .write_event(Event::Comment(quick_xml::events::BytesText::new(&comment)))
                .map_err(|e| ComicInfoError::ToXml(e.to_string()))?;
        }
    }

    write_fn(writer, event.to_owned()).map_err(|e| ComicInfoError::ToXml(e.to_string()))?;
    Ok(())
}

impl ComicInfo {
    pub fn to_xml(&self) -> Result<String, ComicInfoError> {
        let xml =
            serde_xml_rs::to_string(self).map_err(|e| ComicInfoError::ToXml(e.to_string()))?;

        let mut reader = Reader::from_str(&xml);
        reader.trim_text(true);

        let mut output = Vec::new();
        let mut writer = Writer::new_with_indent(Cursor::new(&mut output), b' ', 2);

        let page_filenames: std::collections::HashMap<i32, String> = self
            .pages
            .as_ref()
            .map(|pages| {
                pages
                    .page
                    .iter()
                    .filter_map(|p| p.filename.as_ref().map(|f| (p.image, f.clone())))
                    .collect()
            })
            .unwrap_or_default();

        loop {
            match reader.read_event() {
                Ok(Event::Eof) => break,
                Ok(Event::Decl(decl)) => {
                    writer
                        .write_event(Event::Decl(decl))
                        .map_err(|e| ComicInfoError::ToXml(e.to_string()))?;
                }
                Ok(Event::Empty(e)) if e.name().as_ref() == b"Page" => {
                    write_page_event_with_filename_comment(
                        &e,
                        &page_filenames,
                        &mut writer,
                        |w, evt| w.write_event(Event::Empty(evt)),
                    )?;
                }
                Ok(Event::Start(e)) if e.name().as_ref() == b"Page" => {
                    write_page_event_with_filename_comment(
                        &e,
                        &page_filenames,
                        &mut writer,
                        |w, evt| w.write_event(Event::Start(evt)),
                    )?;
                }
                Ok(event) => {
                    writer
                        .write_event(event)
                        .map_err(|e| ComicInfoError::ToXml(e.to_string()))?;
                }
                Err(e) => return Err(ComicInfoError::ToXml(e.to_string())),
            }
        }

        String::from_utf8(output).map_err(|e| ComicInfoError::ToXml(e.to_string()))
    }

    pub fn validate(&self) -> Result<(), ComicInfoError> {
        if let Some(pages) = &self.pages {
            for page in &pages.page {
                if page.image < 0 {
                    return Err(ComicInfoError::Validate(
                        "Page image index must be non-negative".into(),
                    ));
                }
            }
        }
        Ok(())
    }
}

#[derive(Debug)]
pub enum ComicInfoError {
    ToXml(String),
    Validate(String),
}

impl fmt::Display for ComicInfoError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ComicInfoError::ToXml(msg) => {
                write!(f, "Failed to serialize ComicInfo to XML: {}", msg)
            }
            ComicInfoError::Validate(msg) => write!(f, "ComicInfo validation failed: {}", msg),
        }
    }
}

impl std::error::Error for ComicInfoError {}

impl ToErrorResponse for ComicInfoError {
    fn to_error_response(&self) -> ErrorResponse {
        match self {
            ComicInfoError::ToXml(msg) => {
                ErrorResponse::new(ErrorResponseType::FailedToParseComicInfoXml, msg.clone())
            }
            ComicInfoError::Validate(msg) => {
                ErrorResponse::new(ErrorResponseType::ComicInfoXmlInvalid, msg.clone())
            }
        }
    }
}

impl<'de> serde::Deserialize<'de> for ComicInfo {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::de::Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(deny_unknown_fields)]
        struct StrictComicInfo {
            #[serde(rename = "Title", default)]
            pub title: Option<String>,
            #[serde(rename = "Series", default)]
            pub series: Option<String>,
            #[serde(rename = "Number", default)]
            pub number: Option<String>,
            #[serde(rename = "Count", default = "default_minus_one")]
            pub count: i32,
            #[serde(rename = "Volume", default = "default_minus_one")]
            pub volume: i32,
            #[serde(rename = "AlternateSeries", default)]
            pub alternate_series: Option<String>,
            #[serde(rename = "AlternateNumber", default)]
            pub alternate_number: Option<String>,
            #[serde(rename = "AlternateCount", default = "default_minus_one")]
            pub alternate_count: i32,
            #[serde(rename = "Summary", default)]
            pub summary: Option<String>,
            #[serde(rename = "Notes", default)]
            pub notes: Option<String>,
            #[serde(rename = "Year", default = "default_minus_one")]
            pub year: i32,
            #[serde(rename = "Month", default = "default_minus_one")]
            pub month: i32,
            #[serde(rename = "Day", default = "default_minus_one")]
            pub day: i32,
            #[serde(rename = "Writer", default)]
            pub writer: Option<String>,
            #[serde(rename = "Penciller", default)]
            pub penciller: Option<String>,
            #[serde(rename = "Inker", default)]
            pub inker: Option<String>,
            #[serde(rename = "Colorist", default)]
            pub colorist: Option<String>,
            #[serde(rename = "Letterer", default)]
            pub letterer: Option<String>,
            #[serde(rename = "CoverArtist", default)]
            pub cover_artist: Option<String>,
            #[serde(rename = "Editor", default)]
            pub editor: Option<String>,
            #[serde(rename = "Translator", default)]
            pub translator: Option<String>,
            #[serde(rename = "Publisher", default)]
            pub publisher: Option<String>,
            #[serde(rename = "Imprint", default)]
            pub imprint: Option<String>,
            #[serde(rename = "Genre", default)]
            pub genre: Option<String>,
            #[serde(rename = "Tags", default)]
            pub tags: Option<String>,
            #[serde(rename = "Web", default)]
            pub web: Option<String>,
            #[serde(rename = "PageCount", default)]
            pub page_count: i32,
            #[serde(rename = "LanguageISO", default)]
            pub language_iso: Option<String>,
            #[serde(rename = "Format", default)]
            pub format: Option<String>,
            #[serde(rename = "BlackAndWhite", default = "default_yes_no")]
            pub black_and_white: YesNo,
            #[serde(rename = "Manga", default = "default_manga")]
            pub manga: Manga,
            #[serde(rename = "Characters", default)]
            pub characters: Option<String>,
            #[serde(rename = "Teams", default)]
            pub teams: Option<String>,
            #[serde(rename = "Locations", default)]
            pub locations: Option<String>,
            #[serde(rename = "ScanInformation", default)]
            pub scan_information: Option<String>,
            #[serde(rename = "StoryArc", default)]
            pub story_arc: Option<String>,
            #[serde(rename = "StoryArcNumber", default)]
            pub story_arc_number: Option<String>,
            #[serde(rename = "SeriesGroup", default)]
            pub series_group: Option<String>,
            #[serde(rename = "AgeRating", default = "default_age_rating")]
            pub age_rating: AgeRating,
            #[serde(rename = "Pages", default)]
            pub pages: Option<Pages>,
            #[serde(rename = "CommunityRating", default)]
            pub community_rating: Option<f32>,
            #[serde(rename = "MainCharacterOrTeam", default)]
            pub main_character_or_team: Option<String>,
            #[serde(rename = "Review", default)]
            pub review: Option<String>,
            #[serde(rename = "GTIN", default)]
            pub gtin: Option<String>,
        }

        let strict = StrictComicInfo::deserialize(deserializer)?;
        Ok(ComicInfo {
            title: strict.title,
            series: strict.series,
            number: strict.number,
            count: strict.count,
            volume: strict.volume,
            alternate_series: strict.alternate_series,
            alternate_number: strict.alternate_number,
            alternate_count: strict.alternate_count,
            summary: strict.summary,
            notes: strict.notes,
            year: strict.year,
            month: strict.month,
            day: strict.day,
            writer: strict.writer,
            penciller: strict.penciller,
            inker: strict.inker,
            colorist: strict.colorist,
            letterer: strict.letterer,
            cover_artist: strict.cover_artist,
            editor: strict.editor,
            translator: strict.translator,
            publisher: strict.publisher,
            imprint: strict.imprint,
            genre: strict.genre,
            tags: strict.tags,
            web: strict.web,
            page_count: strict.page_count,
            language_iso: strict.language_iso,
            format: strict.format,
            black_and_white: strict.black_and_white,
            manga: strict.manga,
            characters: strict.characters,
            teams: strict.teams,
            locations: strict.locations,
            scan_information: strict.scan_information,
            story_arc: strict.story_arc,
            story_arc_number: strict.story_arc_number,
            series_group: strict.series_group,
            age_rating: strict.age_rating,
            pages: strict.pages,
            community_rating: strict.community_rating,
            main_character_or_team: strict.main_character_or_team,
            review: strict.review,
            gtin: strict.gtin,
        })
    }
}

pub fn get_bookmarked_pages(comic_info: &ComicInfo, image_files: &[String]) -> Vec<String> {
    let pages = match &comic_info.pages {
        Some(pages) => pages,
        None => return vec![],
    };

    pages
        .page
        .iter()
        .filter(|page| !page.bookmark.is_empty())
        .filter_map(|page| {
            let index = page.image as usize;
            image_files.get(index).cloned()
        })
        .collect()
}

/// Formats a ComicInfo XML string and returns the formatted XML or an error string.
pub fn format_comicinfo_xml_str(xml: &str) -> Result<String, String> {
    let comic_info = ComicInfo::parse(xml).map_err(|e| format!("Parse error: {}", e))?;
    comic_info
        .to_xml()
        .map_err(|e| format!("Serialization error: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::comicinfo::{ComicPageInfo, ComicPageType};

    #[test]
    fn test_format_comicinfo_xml_str() {
        let input_xml = r#"<ComicInfo><Title>Test Comic</Title></ComicInfo>"#;
        let expected_output = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ComicInfo>\n  <Title>Test Comic</Title>\n</ComicInfo>";
        let result = format_comicinfo_xml_str(input_xml);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), expected_output);
    }

    #[test]
    fn test_format_comicinfo_xml_str_empty_xml() {
        let input_xml = "";
        let result = format_comicinfo_xml_str(input_xml);
        let expected = ComicInfoParseError::EmptyXml.to_string();
        assert!(
            result.is_err(),
            "Expected error for empty XML, got: {:?}",
            result
        );
        let err_msg = result.unwrap_err();
        assert!(
            err_msg.contains(&expected),
            "Expected error message to contain '{}', got: '{}'",
            expected,
            err_msg
        );
    }

    #[test]
    fn test_format_comicinfo_xml_str_malformed_xml() {
        let input_xml = "<ComicInfo><Title>Test Comic</Title>";
        let result = format_comicinfo_xml_str(input_xml);
        let expected = ComicInfoParseError::NoRootElement.to_string();
        assert!(
            result.is_err(),
            "Expected error for malformed XML, got: {:?}",
            result
        );
        let err_msg = result.unwrap_err();
        assert!(
            err_msg.contains(&expected),
            "Expected error message to contain '{}', got: '{}'",
            expected,
            err_msg
        );
    }

    #[test]
    fn test_format_comicinfo_xml_str_trailing_content() {
        let input_xml = r#"<ComicInfo><Title>Test Comic</Title></ComicInfo> trailing"#;
        let result = format_comicinfo_xml_str(input_xml);
        let expected = ComicInfoParseError::TrailingContent.to_string();
        assert!(
            result.is_err(),
            "Expected error for trailing content, got: {:?}",
            result
        );
        let err_msg = result.unwrap_err();
        assert!(
            err_msg.contains(&expected),
            "Expected error message to contain '{}', got: '{}'",
            expected,
            err_msg
        );
    }

    #[test]
    fn test_to_xml_with_filename_comments() {
        let comic = ComicInfo {
            pages: Some(Pages {
                page: vec![
                    ComicPageInfo {
                        image: 0,
                        type_: Some(ComicPageType::FrontCover),
                        double_page: false,
                        image_size: 0,
                        key: "".to_string(),
                        bookmark: "Cover".to_string(),
                        image_width: -1,
                        image_height: -1,
                        filename: Some("cover.jpg".to_string()),
                    },
                    ComicPageInfo {
                        image: 1,
                        type_: Some(ComicPageType::Story),
                        double_page: false,
                        image_size: 0,
                        key: "".to_string(),
                        bookmark: "Chapter 1".to_string(),
                        image_width: -1,
                        image_height: -1,
                        filename: Some("page001.jpg".to_string()),
                    },
                ],
            }),
            ..ComicInfo::default()
        };

        let xml = comic.to_xml().unwrap();

        // Verify comments are present in the XML
        assert!(
            xml.contains("<!-- filename: cover.jpg -->"),
            "XML should contain comment for cover.jpg"
        );
        assert!(
            xml.contains("<!-- filename: page001.jpg -->"),
            "XML should contain comment for page001.jpg"
        );

        // Verify the structure is correct
        assert!(xml.contains("<Pages>"));
        assert!(xml.contains("Image=\"0\""));
        assert!(xml.contains("Image=\"1\""));
        assert!(xml.contains("Type=\"FrontCover\""));
        assert!(xml.contains("Bookmark=\"Cover\""));
    }

    #[test]
    fn test_to_xml_without_filename_comments() {
        let comic = ComicInfo {
            pages: Some(Pages {
                page: vec![ComicPageInfo {
                    image: 0,
                    type_: Some(ComicPageType::Story),
                    double_page: false,
                    image_size: 0,
                    key: "".to_string(),
                    bookmark: "".to_string(),
                    image_width: -1,
                    image_height: -1,
                    filename: None,
                }],
            }),
            ..ComicInfo::default()
        };

        let xml = comic.to_xml().unwrap();

        // Verify no comments are present when filename is None
        assert!(
            !xml.contains("<!-- filename:"),
            "XML should not contain filename comments when filename is None"
        );
    }

    #[test]
    fn test_to_xml_mixed_filename_comments() {
        let comic = ComicInfo {
            pages: Some(Pages {
                page: vec![
                    ComicPageInfo {
                        image: 0,
                        type_: Some(ComicPageType::FrontCover),
                        double_page: false,
                        image_size: 0,
                        key: "".to_string(),
                        bookmark: "".to_string(),
                        image_width: -1,
                        image_height: -1,
                        filename: Some("cover.jpg".to_string()),
                    },
                    ComicPageInfo {
                        image: 1,
                        type_: Some(ComicPageType::Story),
                        double_page: false,
                        image_size: 0,
                        key: "".to_string(),
                        bookmark: "".to_string(),
                        image_width: -1,
                        image_height: -1,
                        filename: None, // This one has no filename
                    },
                    ComicPageInfo {
                        image: 2,
                        type_: Some(ComicPageType::BackCover),
                        double_page: false,
                        image_size: 0,
                        key: "".to_string(),
                        bookmark: "".to_string(),
                        image_width: -1,
                        image_height: -1,
                        filename: Some("back.jpg".to_string()),
                    },
                ],
            }),
            ..ComicInfo::default()
        };

        let xml = comic.to_xml().unwrap();

        // Verify only the pages with filenames have comments
        assert!(
            xml.contains("<!-- filename: cover.jpg -->"),
            "XML should contain comment for cover.jpg"
        );
        assert!(
            xml.contains("<!-- filename: back.jpg -->"),
            "XML should contain comment for back.jpg"
        );

        // Count occurrences - should be exactly 2 comments
        let comment_count = xml.matches("<!-- filename:").count();
        assert_eq!(comment_count, 2, "Should have exactly 2 filename comments");
    }
}
