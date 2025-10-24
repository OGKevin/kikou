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

        let xml_options =
            FileOptions::<()>::default().compression_method(CompressionMethod::Stored);

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

/// Builds the page list for ComicInfo based on provided settings.
///
/// This function implements a deletion-by-omission strategy where only pages
/// explicitly provided in the settings map are included in the final page list.
/// Any page not present in the settings will be excluded from the XML, effectively
/// deleting it from the ComicInfo metadata.
///
/// For pages that are included, the function preserves metadata (image dimensions,
/// size, and key) from the original ComicInfo if available, while updating the
/// user-editable fields (page type, double page flag, and bookmark) from the
/// provided settings.
///
/// # Arguments
///
/// * `pages` - Mutable reference to the Pages structure that will be populated
/// * `sorted_files` - Sorted list of image filenames in the archive
/// * `page_settings` - Map of filename to PageSettings for pages to keep/update
/// * `original_pages_map` - Map of image index to original ComicPageInfo for preserving metadata
fn build_page_list(
    pages: &mut Pages,
    sorted_files: &[String],
    page_settings: &HashMap<String, PageSettings>,
    original_pages_map: &HashMap<i32, ComicPageInfo>,
) {
    for (index, file_name) in sorted_files.iter().enumerate() {
        let image_index = index as i32;

        if let Some(settings) = page_settings.get(file_name) {
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

            // Set the filename for XML comment generation
            page_info.filename = Some(file_name.clone());

            pages.page.push(page_info);
        }
    }
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

    build_page_list(pages, &sorted, &page_settings, &original_pages_map);

    suppress_next_archive_event(&path);
    let xml_content = updated_comic_info.to_xml().map_err(|e| e.to_string())?;
    update_zip_with_comicinfo(&path, &xml_content)?;

    Ok(())
}

/// Restores filenames from existing ComicInfo pages by matching image indices.
///
/// When a ComicInfo is being edited, this function attempts to preserve the
/// filename information by matching pages in the new ComicInfo with those in
/// the existing ComicInfo based on their image index. This ensures that manual
/// XML edits do not lose the filename mapping.
fn restore_filenames_from_existing_pages(
    comic_info: &mut ComicInfo,
    archive: &super::types::Archive,
) {
    if let Some(existing_comic_info) = &archive.comic_info {
        if let (Some(new_pages), Some(existing_pages)) =
            (&mut comic_info.pages, &existing_comic_info.pages)
        {
            let filename_map: std::collections::HashMap<i32, String> = existing_pages
                .page
                .iter()
                .filter_map(|p| p.filename.as_ref().map(|f| (p.image, f.clone())))
                .collect();

            for page in &mut new_pages.page {
                if let Some(filename) = filename_map.get(&page.image) {
                    page.filename = Some(filename.clone());
                }
            }
        }
    }
}

/// Populates filenames for pages that don't have them by matching with archive files.
///
/// For pages without filenames (typically new pages or pages from external sources),
/// this function maps them to actual image files in the archive by using the image
/// index to look up the corresponding file in the sorted list of archive images.
fn populate_filenames_from_archive(comic_info: &mut ComicInfo, archive: &super::types::Archive) {
    if let Some(ref mut pages) = comic_info.pages {
        let image_files = archive
            .files
            .iter()
            .filter(|f| is_image_file(&f.name))
            .map(|f| f.name.clone())
            .collect::<Vec<_>>();

        let mut sorted = image_files;
        sorted.sort();

        for page in &mut pages.page {
            if page.filename.is_none() {
                let index = page.image as usize;
                if let Some(filename) = sorted.get(index) {
                    page.filename = Some(filename.clone());
                }
            }
        }
    }
}

/// Business logic for saving ComicInfo XML
pub fn save_comicinfo_xml_impl(path: String, xml: String) -> Result<String, String> {
    debug!("Saving ComicInfo XML to {} with xml {}", path, xml);

    let mut comic_info: ComicInfo = serde_xml_rs::from_str(&xml).map_err(|e| e.to_string())?;
    comic_info.validate().map_err(|e| e.to_string())?;

    let archive = read_archive(&path).map_err(|e| e.to_string())?;

    restore_filenames_from_existing_pages(&mut comic_info, &archive);
    populate_filenames_from_archive(&mut comic_info, &archive);

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
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

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
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

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
            let zip = zip::ZipWriter::new(file);
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
            let zip = zip::ZipWriter::new(file);
            zip.finish().expect("finish zip");
        }

        let invalid_xml = r#"not valid xml"#;
        let result = save_comicinfo_xml_impl(path.clone(), invalid_xml.to_string());
        assert!(result.is_err());

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_page_settings_deletes_page_when_not_in_settings() {
        let path = test_path("test_page_deletion.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("image1.jpg", options).expect("start file");
            zip.write_all(b"fake image data").expect("write data");

            zip.start_file("image2.jpg", options).expect("start file");
            zip.write_all(b"fake image data 2").expect("write data");

            zip.start_file("image3.jpg", options).expect("start file");
            zip.write_all(b"fake image data 3").expect("write data");

            zip.finish().expect("finish zip");
        }

        // First, create initial ComicInfo with all 3 pages
        {
            let mut initial_settings: HashMap<String, PageSettings> = HashMap::new();
            initial_settings.insert(
                "image1.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::FrontCover,
                    double_page: false,
                    bookmark: "Cover".to_string(),
                    image: 0,
                },
            );
            initial_settings.insert(
                "image2.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "Chapter 1".to_string(),
                    image: 1,
                },
            );
            initial_settings.insert(
                "image3.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::BackCover,
                    double_page: false,
                    bookmark: "".to_string(),
                    image: 2,
                },
            );

            let res = save_page_settings_impl(path.clone(), initial_settings);
            assert!(res.is_ok(), "Initial save failed: {:?}", res.err());
        }

        // Verify initial state has 3 pages
        {
            let file = std::fs::File::open(&path).expect("open cbz");
            let mut archive = zip::ZipArchive::new(file).expect("open zip archive");
            let mut comic_file = archive.by_name("ComicInfo.xml").expect("comicinfo exists");
            let mut xml = String::new();
            comic_file.read_to_string(&mut xml).expect("read xml");

            let ci = ComicInfo::parse(&xml).expect("parse xml");
            let pages = ci.pages.unwrap().page;
            assert_eq!(pages.len(), 3, "Initial state should have 3 pages");
        }

        // Now save with only image1.jpg and image3.jpg (delete image2.jpg)
        {
            let mut new_settings: HashMap<String, PageSettings> = HashMap::new();
            new_settings.insert(
                "image1.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::FrontCover,
                    double_page: false,
                    bookmark: "Cover".to_string(),
                    image: 0,
                },
            );
            // Note: image2.jpg is NOT included - should be deleted
            new_settings.insert(
                "image3.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::BackCover,
                    double_page: false,
                    bookmark: "".to_string(),
                    image: 2,
                },
            );

            let res = save_page_settings_impl(path.clone(), new_settings);
            assert!(res.is_ok(), "Second save failed: {:?}", res.err());
        }

        // Verify that image2 page was deleted
        {
            let file = std::fs::File::open(&path).expect("open cbz");
            let mut archive = zip::ZipArchive::new(file).expect("open zip archive");
            let mut comic_file = archive.by_name("ComicInfo.xml").expect("comicinfo exists");
            let mut xml = String::new();
            comic_file.read_to_string(&mut xml).expect("read xml");

            let ci = ComicInfo::parse(&xml).expect("parse xml");
            let pages = ci.pages.unwrap().page;
            assert_eq!(pages.len(), 2, "After deletion should have 2 pages");

            // Verify remaining pages are image1 and image3
            assert_eq!(pages[0].bookmark, "Cover");
            assert_eq!(pages[1].bookmark, "");
        }

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_page_settings_clears_all_pages_when_empty_settings() {
        let path = test_path("test_clear_all_pages.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("image1.jpg", options).expect("start file");
            zip.write_all(b"fake image data").expect("write data");

            zip.start_file("image2.jpg", options).expect("start file");
            zip.write_all(b"fake image data 2").expect("write data");

            zip.finish().expect("finish zip");
        }

        // Create initial ComicInfo with pages
        {
            let mut initial_settings: HashMap<String, PageSettings> = HashMap::new();
            initial_settings.insert(
                "image1.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "Chapter".to_string(),
                    image: 0,
                },
            );
            initial_settings.insert(
                "image2.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "Chapter 2".to_string(),
                    image: 1,
                },
            );

            save_page_settings_impl(path.clone(), initial_settings).expect("initial save failed");
        }

        // Save with empty settings (delete all pages)
        {
            let empty_settings: HashMap<String, PageSettings> = HashMap::new();
            let res = save_page_settings_impl(path.clone(), empty_settings);
            assert!(
                res.is_ok(),
                "Save with empty settings failed: {:?}",
                res.err()
            );
        }

        // Verify all pages were cleared
        {
            let file = std::fs::File::open(&path).expect("open cbz");
            let mut archive = zip::ZipArchive::new(file).expect("open zip archive");
            let mut comic_file = archive.by_name("ComicInfo.xml").expect("comicinfo exists");
            let mut xml = String::new();
            comic_file.read_to_string(&mut xml).expect("read xml");

            let ci = ComicInfo::parse(&xml).expect("parse xml");
            let pages = ci.pages.map(|p| p.page).unwrap_or_default();
            assert_eq!(pages.len(), 0, "All pages should be deleted");
        }

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_page_settings_preserves_metadata_on_full_update() {
        let path = test_path("test_preserve_metadata.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("image1.jpg", options).expect("start file");
            zip.write_all(b"fake image data").expect("write data");

            zip.start_file("image2.jpg", options).expect("start file");
            zip.write_all(b"fake image data 2").expect("write data");

            zip.finish().expect("finish zip");
        }

        // Create initial ComicInfo with metadata (e.g., image_width, image_height, key)
        {
            let mut initial_settings: HashMap<String, PageSettings> = HashMap::new();
            initial_settings.insert(
                "image1.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "Original".to_string(),
                    image: 0,
                },
            );
            initial_settings.insert(
                "image2.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "".to_string(),
                    image: 1,
                },
            );

            save_page_settings_impl(path.clone(), initial_settings).expect("initial save failed");
        }

        // Update with both image1 and image2 - frontend sends all pages it wants to keep
        {
            let mut updated_settings: HashMap<String, PageSettings> = HashMap::new();
            updated_settings.insert(
                "image1.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "Updated".to_string(),
                    image: 0,
                },
            );
            updated_settings.insert(
                "image2.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "".to_string(),
                    image: 1,
                },
            );

            save_page_settings_impl(path.clone(), updated_settings).expect("update failed");
        }

        // Verify both pages still exist and image1 is updated
        {
            let file = std::fs::File::open(&path).expect("open cbz");
            let mut archive = zip::ZipArchive::new(file).expect("open zip archive");
            let mut comic_file = archive.by_name("ComicInfo.xml").expect("comicinfo exists");
            let mut xml = String::new();
            comic_file.read_to_string(&mut xml).expect("read xml");

            let ci = ComicInfo::parse(&xml).expect("parse xml");
            let pages = ci.pages.unwrap().page;
            assert_eq!(pages.len(), 2, "Both pages should be present");

            // image1 should be updated
            assert_eq!(pages[0].bookmark, "Updated");
            // image2 should remain unchanged
            assert_eq!(pages[1].bookmark, "");
        }

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_page_settings_deletes_unspecified_pages_on_partial_update() {
        let path = test_path("test_delete_on_partial_update.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("image1.jpg", options).expect("start file");
            zip.write_all(b"fake image data").expect("write data");

            zip.start_file("image2.jpg", options).expect("start file");
            zip.write_all(b"fake image data 2").expect("write data");

            zip.start_file("image3.jpg", options).expect("start file");
            zip.write_all(b"fake image data 3").expect("write data");

            zip.finish().expect("finish zip");
        }

        // Create initial ComicInfo with all 3 pages
        {
            let mut initial_settings: HashMap<String, PageSettings> = HashMap::new();
            initial_settings.insert(
                "image1.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "Page 1".to_string(),
                    image: 0,
                },
            );
            initial_settings.insert(
                "image2.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "Page 2".to_string(),
                    image: 1,
                },
            );
            initial_settings.insert(
                "image3.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "Page 3".to_string(),
                    image: 2,
                },
            );

            save_page_settings_impl(path.clone(), initial_settings).expect("initial save failed");
        }

        // Update with only image1 and image3 (image2 is NOT provided, simulating user clearing it)
        {
            let mut partial_settings: HashMap<String, PageSettings> = HashMap::new();
            partial_settings.insert(
                "image1.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "Page 1 Updated".to_string(),
                    image: 0,
                },
            );
            // image2.jpg is deliberately omitted - should be deleted
            partial_settings.insert(
                "image3.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "Page 3".to_string(),
                    image: 2,
                },
            );

            save_page_settings_impl(path.clone(), partial_settings).expect("partial update failed");
        }

        // Verify that image2 was deleted and only image1 and image3 remain
        {
            let file = std::fs::File::open(&path).expect("open cbz");
            let mut archive = zip::ZipArchive::new(file).expect("open zip archive");
            let mut comic_file = archive.by_name("ComicInfo.xml").expect("comicinfo exists");
            let mut xml = String::new();
            comic_file.read_to_string(&mut xml).expect("read xml");

            let ci = ComicInfo::parse(&xml).expect("parse xml");
            let pages = ci.pages.unwrap().page;
            assert_eq!(
                pages.len(),
                2,
                "Should have only 2 pages after deleting image2"
            );

            // image1 should be updated
            assert_eq!(pages[0].bookmark, "Page 1 Updated");
            // image3 should remain
            assert_eq!(pages[1].bookmark, "Page 3");
        }

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_page_settings_writes_filename_comments() {
        let path = test_path("test_filename_comments.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("cover.jpg", options).expect("start file");
            zip.write_all(b"fake cover").expect("write data");

            zip.start_file("page001.jpg", options).expect("start file");
            zip.write_all(b"fake page 1").expect("write data");

            zip.start_file("page002.jpg", options).expect("start file");
            zip.write_all(b"fake page 2").expect("write data");

            zip.finish().expect("finish zip");
        }

        let mut settings: HashMap<String, PageSettings> = HashMap::new();
        settings.insert(
            "cover.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::FrontCover,
                double_page: false,
                bookmark: "Cover".to_string(),
                image: 0,
            },
        );
        settings.insert(
            "page001.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::Story,
                double_page: false,
                bookmark: "Chapter 1".to_string(),
                image: 1,
            },
        );
        settings.insert(
            "page002.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::Story,
                double_page: false,
                bookmark: "".to_string(),
                image: 2,
            },
        );

        let res = save_page_settings_impl(path.clone(), settings);
        assert!(
            res.is_ok(),
            "save_page_settings_impl failed: {:?}",
            res.err()
        );

        // Read the raw XML and verify it contains filename comments
        let file = std::fs::File::open(&path).expect("open cbz");
        let mut archive = zip::ZipArchive::new(file).expect("open zip archive");
        let mut comic_file = archive.by_name("ComicInfo.xml").expect("comicinfo exists");
        let mut xml = String::new();
        comic_file.read_to_string(&mut xml).expect("read xml");

        // Verify filename comments are present
        assert!(
            xml.contains("<!-- filename: cover.jpg -->"),
            "XML should contain comment for cover.jpg"
        );
        assert!(
            xml.contains("<!-- filename: page001.jpg -->"),
            "XML should contain comment for page001.jpg"
        );
        assert!(
            xml.contains("<!-- filename: page002.jpg -->"),
            "XML should contain comment for page002.jpg"
        );

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_comicinfo_xml_preserves_filename_comments() {
        let path = test_path("test_xml_save_preserves_comments.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("image1.jpg", options).expect("start file");
            zip.write_all(b"fake image 1").expect("write data");

            zip.start_file("image2.jpg", options).expect("start file");
            zip.write_all(b"fake image 2").expect("write data");

            zip.finish().expect("finish zip");
        }

        // First, create initial ComicInfo with page settings so filenames are set
        {
            let mut initial_settings: HashMap<String, PageSettings> = HashMap::new();
            initial_settings.insert(
                "image1.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::FrontCover,
                    double_page: false,
                    bookmark: "Cover".to_string(),
                    image: 0,
                },
            );
            initial_settings.insert(
                "image2.jpg".to_string(),
                PageSettings {
                    page_type: ComicPageType::Story,
                    double_page: false,
                    bookmark: "".to_string(),
                    image: 1,
                },
            );

            save_page_settings_impl(path.clone(), initial_settings).expect("initial save failed");
        }

        // Now edit the XML manually (simulating user editing in XmlEditor)
        let edited_xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<ComicInfo>
  <Title>My Edited Comic</Title>
  <Pages>
    <Page Image="0" Type="FrontCover" Bookmark="New Cover Name" />
    <Page Image="1" Type="Story" Bookmark="New Chapter" />
  </Pages>
</ComicInfo>"#;

        let result = save_comicinfo_xml_impl(path.clone(), edited_xml.to_string());
        assert!(
            result.is_ok(),
            "save_comicinfo_xml_impl failed: {:?}",
            result.err()
        );

        // Verify that the returned XML contains filename comments
        let saved_xml = result.unwrap();
        assert!(
            saved_xml.contains("<!-- filename: image1.jpg -->"),
            "Saved XML should contain comment for image1.jpg"
        );
        assert!(
            saved_xml.contains("<!-- filename: image2.jpg -->"),
            "Saved XML should contain comment for image2.jpg"
        );

        // Also verify the edited content is preserved
        assert!(saved_xml.contains("<Title>My Edited Comic</Title>"));
        assert!(saved_xml.contains("Bookmark=\"New Cover Name\""));
        assert!(saved_xml.contains("Bookmark=\"New Chapter\""));

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_comicinfo_xml_adds_filename_comments_for_new_pages() {
        let path = test_path("test_xml_new_pages_comments.cbz");
        let _ = std::fs::remove_file(&path);

        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("page1.jpg", options).expect("start file");
            zip.write_all(b"fake page 1").expect("write data");

            zip.start_file("page2.jpg", options).expect("start file");
            zip.write_all(b"fake page 2").expect("write data");

            zip.finish().expect("finish zip");
        }

        // User creates new ComicInfo XML from scratch
        let new_xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<ComicInfo>
  <Title>New Comic</Title>
  <Pages>
    <Page Image="0" Type="FrontCover" />
    <Page Image="1" Type="Story" />
  </Pages>
</ComicInfo>"#;

        let result = save_comicinfo_xml_impl(path.clone(), new_xml.to_string());
        assert!(
            result.is_ok(),
            "save_comicinfo_xml_impl failed: {:?}",
            result.err()
        );

        // Verify that the XML gets filename comments even for brand new pages
        let saved_xml = result.unwrap();
        assert!(
            saved_xml.contains("<!-- filename: page1.jpg -->"),
            "Saved XML should contain comment for page1.jpg"
        );
        assert!(
            saved_xml.contains("<!-- filename: page2.jpg -->"),
            "Saved XML should contain comment for page2.jpg"
        );

        let _ = std::fs::remove_file(&path);
    }
}
