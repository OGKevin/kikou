use serde::{Deserialize, Serialize};
use std::fmt;

use crate::comicinfo::info::ComicInfoParseError;

#[derive(Serialize, Deserialize)]
pub struct ArchiveFile {
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct Archive {
    pub files: Vec<ArchiveFile>,
    pub comic_info: Option<crate::comicinfo::ComicInfo>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct LoadCbzResponse {
    pub image_files: Vec<String>,
    pub comic_info: Option<crate::comicinfo::ComicInfo>,
    pub error: Option<ErrorResponse>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ErrorResponseType {
    #[serde(rename = "FailedToLoadArchive")]
    FailedToLoadArchive,
    #[serde(rename = "FailedToParseComicInfoXml")]
    FailedToParseComicInfoXml,
    #[serde(rename = "ComicInfoXmlInvalid")]
    ComicInfoXmlInvalid,
    #[serde(rename = "Other")]
    Other,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ErrorResponse {
    pub error_type: ErrorResponseType,
    pub message: String,
}

impl ErrorResponse {
    pub fn new(error_type: ErrorResponseType, message: impl Into<String>) -> Self {
        ErrorResponse {
            error_type,
            message: message.into(),
        }
    }
}

#[derive(Debug)]
pub enum ReadArchiveError {
    Io(std::io::Error),
    Zip(zip::result::ZipError),
    FailedToParseComicInfoXml(ComicInfoParseError),
}

impl fmt::Display for ReadArchiveError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ReadArchiveError::Io(err) => write!(f, "IO error: {}.", err),
            ReadArchiveError::Zip(err) => write!(f, "Zip error: {}", err),
            ReadArchiveError::FailedToParseComicInfoXml(err) => {
                write!(f, "Failed to parse ComicInfo XML: {}", err)
            }
        }
    }
}

impl std::error::Error for ReadArchiveError {}

/// Trait for converting various backend errors into a serializable
/// `ErrorResponse` that the frontend can inspect.
pub trait ToErrorResponse {
    fn to_error_response(&self) -> ErrorResponse;
}

impl ToErrorResponse for ReadArchiveError {
    fn to_error_response(&self) -> ErrorResponse {
        match self {
            ReadArchiveError::Io(err) => {
                let msg = match err.kind() {
                    std::io::ErrorKind::NotFound => {
                        "Archive file not found. Please create the file or mount the disk to continue.".to_string()
                    }
                    _ => format!("IO error: {}", err),
                };
                ErrorResponse::new(ErrorResponseType::FailedToLoadArchive, msg)
            }
            ReadArchiveError::Zip(err) => ErrorResponse::new(
                ErrorResponseType::FailedToLoadArchive,
                format!("Zip error: {}", err),
            ),
            ReadArchiveError::FailedToParseComicInfoXml(err) => ErrorResponse::new(
                ErrorResponseType::FailedToParseComicInfoXml,
                format!("Failed to parse ComicInfo XML: {}", err),
            ),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct FileDataResponse {
    pub data: Option<Vec<u8>>,
    pub error: Option<ErrorResponse>,
}

const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "gif", "bmp", "webp"];

pub fn is_image_file(name: &str) -> bool {
    let name_lower = name.to_lowercase();
    IMAGE_EXTENSIONS
        .iter()
        .any(|ext| name_lower.ends_with(&format!(".{}", ext)))
}
