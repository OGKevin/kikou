use super::types::{Archive, ArchiveFile, ReadArchiveError};
use crate::comicinfo::ComicInfo;
use std::io::Read;

fn open_zip_archive(path: &str) -> Result<zip::ZipArchive<std::fs::File>, ReadArchiveError> {
    let file = std::fs::File::open(path).map_err(ReadArchiveError::Io)?;
    let archive = zip::ZipArchive::new(file).map_err(ReadArchiveError::Zip)?;
    Ok(archive)
}

pub fn read_archive(path: &str) -> Result<Archive, ReadArchiveError> {
    let mut archive = open_zip_archive(path)?;

    let mut files = Vec::new();
    let mut comic_info = None;

    for i in 0..archive.len() {
        let zip_file = archive.by_index(i).map_err(ReadArchiveError::Zip)?;
        let name = zip_file.name().to_string();
        files.push(ArchiveFile { name });
    }

    if let Ok(mut comic_info_file) = archive.by_name("ComicInfo.xml") {
        let mut xml_content = String::new();
        comic_info_file
            .read_to_string(&mut xml_content)
            .map_err(ReadArchiveError::Io)?;
        match ComicInfo::parse(&xml_content) {
            Ok(parsed_comic_info) => {
                comic_info = Some(parsed_comic_info);
            }
            Err(e) => {
                return Err(ReadArchiveError::FailedToParseComicInfoXml(e));
            }
        }
    }

    Ok(Archive { files, comic_info })
}

pub fn get_file_data(path: &str, file_name: &str) -> Result<Vec<u8>, ReadArchiveError> {
    let mut archive = open_zip_archive(path)?;

    let mut zip_file = archive.by_name(file_name).map_err(ReadArchiveError::Zip)?;
    let mut data = Vec::new();
    zip_file
        .read_to_end(&mut data)
        .map_err(ReadArchiveError::Io)?;
    Ok(data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_read_archive_basic() {
        // Basic test to verify read_archive function exists and has correct signature
        let _: fn(&str) -> Result<Archive, ReadArchiveError> = read_archive;
    }

    #[test]
    fn test_get_file_data_basic() {
        // Basic test to verify get_file_data function exists and has correct signature
        let _: fn(&str, &str) -> Result<Vec<u8>, ReadArchiveError> = get_file_data;
    }
}
