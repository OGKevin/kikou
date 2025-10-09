use std::collections::HashMap;
use std::fs;
use std::io::{BufReader, BufWriter, Write};
use zip::CompressionMethod;
use zip::write::FileOptions;

use crate::comicinfo::{ComicInfo, ComicPageInfo, ComicPageType, Pages};
use log::debug;

use super::manager::suppress_next_archive_event;
use super::reader::read_archive;
use super::types::is_image_file;

pub fn update_zip_with_comicinfo(path: &str, xml_content: &str) -> Result<(), String> {
    let temp_path = format!("{}.tmp", path);

    {
        let original_file = fs::File::open(path).map_err(|e| e.to_string())?;
        let mut original_archive =
            zip::ZipArchive::new(BufReader::new(original_file)).map_err(|e| e.to_string())?;

        let temp_file = fs::File::create(&temp_path).map_err(|e| e.to_string())?;
        let mut new_archive = zip::ZipWriter::new(BufWriter::new(temp_file));

        for i in 0..original_archive.len() {
            let file = original_archive
                .by_index_raw(i)
                .map_err(|e| e.to_string())?;
            if file.name() != "ComicInfo.xml" {
                new_archive.raw_copy_file(file).map_err(|e| e.to_string())?;
            }
        }

        let xml_options = FileOptions::default().compression_method(CompressionMethod::Stored);

        new_archive
            .start_file("ComicInfo.xml", xml_options)
            .map_err(|e| e.to_string())?;
        new_archive
            .write_all(xml_content.as_bytes())
            .map_err(|e| e.to_string())?;

        new_archive.finish().map_err(|e| e.to_string())?;
    }

    fs::rename(&temp_path, path).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn delete_comicinfo_xml(path: &str) -> Result<(), String> {
    let temp_path = format!("{}.tmp", path);

    {
        let original_file = fs::File::open(path).map_err(|e| e.to_string())?;
        let mut original_archive =
            zip::ZipArchive::new(BufReader::new(original_file)).map_err(|e| e.to_string())?;

        let temp_file = fs::File::create(&temp_path).map_err(|e| e.to_string())?;
        let mut new_archive = zip::ZipWriter::new(BufWriter::new(temp_file));

        for i in 0..original_archive.len() {
            let file = original_archive
                .by_index_raw(i)
                .map_err(|e| e.to_string())?;
            if file.name() != "ComicInfo.xml" {
                new_archive.raw_copy_file(file).map_err(|e| e.to_string())?;
            }
        }

        new_archive.finish().map_err(|e| e.to_string())?;
    }

    fs::rename(&temp_path, path).map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct PageSettings {
    #[serde(rename = "Type")]
    pub page_type: ComicPageType,
    #[serde(rename = "DoublePage")]
    pub double_page: bool,
    #[serde(rename = "Bookmark")]
    pub bookmark: String,
    #[serde(rename = "Image")]
    pub image: i32,
}

/// Business logic for saving page settings
pub fn save_page_settings_impl(
    path: String,
    page_settings: HashMap<String, PageSettings>,
) -> Result<(), String> {
    let archive = read_archive(&path).map_err(|e| e.to_string())?;

    let image_files = archive
        .files
        .iter()
        .filter(|f| is_image_file(&f.name))
        .map(|f| f.name.clone())
        .collect::<Vec<_>>();

    let mut sorted = image_files;
    sorted.sort();

    let original_comic_info = archive.comic_info.clone();
    let mut updated_comic_info = archive.comic_info.unwrap_or_default();

    if updated_comic_info.pages.is_none() {
        updated_comic_info.pages = Some(Pages { page: Vec::new() });
    }

    let pages = updated_comic_info.pages.as_mut().unwrap();
    // Build a map of original pages to image index for quick lookup
    let original_pages_map: std::collections::HashMap<i32, ComicPageInfo> = original_comic_info
        .as_ref()
        .and_then(|ci| ci.pages.as_ref())
        .map(|p| p.page.iter().cloned().map(|pg| (pg.image, pg)).collect())
        .unwrap_or_default();

    pages.page.clear();

    for (index, file_name) in sorted.iter().enumerate() {
        let image_index = index as i32;

        if let Some(settings) = page_settings.get(file_name) {
            // Create a new page based on provided settings and merge original metadata if present
            let mut page_info = ComicPageInfo::from_page_settings(
                settings.page_type.clone(),
                settings.double_page,
                settings.bookmark.clone(),
                image_index,
            );

            if let Some(original_page) = original_pages_map.get(&image_index) {
                page_info.image_height = original_page.image_height;
                page_info.image_size = original_page.image_size;
                page_info.image_width = original_page.image_width;
                page_info.key = original_page.key.clone();
            }

            pages.page.push(page_info);
            continue;
        }

        // No settings provided for this file - preserve original page if it exists
        if let Some(original_page) = original_pages_map.get(&image_index) {
            pages.page.push(original_page.clone());
            continue;
        }

        // No original nor settings: do not create a page entry
        // This avoids introducing pages for images that had no original metadata
        // and were not explicitly provided in the settings.
        continue;
    }

    suppress_next_archive_event(&path);
    let xml_content = updated_comic_info.to_xml().map_err(|e| e.to_string())?;
    update_zip_with_comicinfo(&path, &xml_content)?;

    Ok(())
}

/// Business logic for saving ComicInfo XML
pub fn save_comicinfo_xml_impl(path: String, xml: String) -> Result<String, String> {
    debug!("Saving ComicInfo XML to {} with xml {}", path, xml);

    let comic_info: ComicInfo = serde_xml_rs::from_str(&xml).map_err(|e| e.to_string())?;
    comic_info.validate().map_err(|e| e.to_string())?;
    let formatted_xml = comic_info.to_xml().map_err(|e| e.to_string())?;

    suppress_next_archive_event(&path);
    update_zip_with_comicinfo(&path, formatted_xml.as_str())?;

    Ok(formatted_xml)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::comicinfo::{ComicInfo, ComicPageType};
    use std::collections::HashMap;
    use std::io::{Read, Write};
    use zip::CompressionMethod as ZipCompressionMethod;
    use zip::write::FileOptions as ZipFileOptions;

    fn test_path(name: &str) -> String {
        let mut dir = std::env::temp_dir();
        dir.push("ebook_manager_tests");
        std::fs::create_dir_all(&dir).expect("create test dir");
        dir.push(name);
        dir.to_str().unwrap().to_string()
    }

    #[test]
    fn test_save_page_settings_impl_creates_comicinfo() {
        let path = test_path("test_save_impl.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("image1.jpg", options).expect("start file");
            zip.write_all(b"fake image data").expect("write data");

            zip.start_file("image2.jpg", options).expect("start file");
            zip.write_all(b"fake image data 2").expect("write data");

            zip.finish().expect("finish zip");
        }

        let mut settings: HashMap<String, PageSettings> = HashMap::new();

        settings.insert(
            "image1.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::FrontCover,
                double_page: false,
                bookmark: "note-1".to_string(),
                image: 0,
            },
        );

        settings.insert(
            "image2.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::Story,
                double_page: true,
                bookmark: "".to_string(),
                image: 1,
            },
        );

        let res = save_page_settings_impl(path.clone(), settings);
        assert!(
            res.is_ok(),
            "save_page_settings_impl failed: {:?}",
            res.err()
        );

        // Check that ComicInfo.xml was created correctly
        let file = std::fs::File::open(&path).expect("open cbz");
        let mut archive = zip::ZipArchive::new(file).expect("open zip archive");
        let mut comic_file = archive.by_name("ComicInfo.xml").expect("comicinfo exists");
        let mut xml = String::new();
        comic_file.read_to_string(&mut xml).expect("read xml");

        let ci = ComicInfo::parse(&xml).expect("parse xml");
        assert!(ci.pages.is_some());
        let pages = ci.pages.unwrap().page;
        assert_eq!(pages.len(), 2);

        assert_eq!(pages[0].bookmark, "note-1");
        assert!(!pages[0].double_page);
        assert!(pages[1].double_page);

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_page_settings_impl_without_emitter() {
        let path = test_path("test_save_no_emit.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("image1.jpg", options).expect("start file");
            zip.write_all(b"fake image data").expect("write data");

            zip.finish().expect("finish zip");
        }

        let mut settings: HashMap<String, PageSettings> = HashMap::new();
        settings.insert(
            "image1.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::FrontCover,
                double_page: false,
                bookmark: "test".to_string(),
                image: 0,
            },
        );

        // Test with None emitter (for use in tests)
        let res = save_page_settings_impl(path.clone(), settings);
        assert!(
            res.is_ok(),
            "save_page_settings_impl failed: {:?}",
            res.err()
        );

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_comicinfo_xml_impl() {
        let path = test_path("test_save_xml_impl.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);
            zip.finish().expect("finish zip");
        }

        let valid_xml = r#"<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  <Title>Valid Test</Title>
</ComicInfo>"#;

        let result = save_comicinfo_xml_impl(path.clone(), valid_xml.to_string());
        assert!(result.is_ok());

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_comicinfo_xml_impl_invalid() {
        let path = test_path("test_save_xml_invalid.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);
            zip.finish().expect("finish zip");
        }

        let invalid_xml = r#"not valid xml"#;
        let result = save_comicinfo_xml_impl(path.clone(), invalid_xml.to_string());
        assert!(result.is_err());

        let _ = std::fs::remove_file(&path);
    }
}
