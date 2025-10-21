pub mod commands;
pub mod event;
pub mod manager;
pub mod reader;
pub mod types;
pub mod watcher;
pub mod writer;

pub use commands::*;
pub use reader::read_archive;
pub use types::is_image_file;

#[cfg(test)]
mod tests {
    use super::writer::PageSettings;
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
    fn test_save_page_settings_creates_comicinfo() {
        let path = test_path("test_save.cbz");

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

        let res = super::writer::save_page_settings_impl(path.clone(), settings);
        assert!(res.is_ok(), "save_page_settings failed: {:?}", res.err());

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
    fn test_read_archive_nonexistent() {
        let path = test_path("nonexistent.zip");
        let _ = std::fs::remove_file(&path);
        let result = read_archive(&path);
        assert!(result.is_err());
    }

    #[test]
    fn test_read_archive_existing_cbz() {
        let path = test_path("comic.cbz");
        // create a minimal cbz if it doesn't exist
        if !std::path::Path::new(&path).exists() {
            let _ = std::fs::remove_file(&path);
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);
            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);
            zip.start_file("image.jpg", options).expect("start file");
            zip.write_all(b"data").expect("write data");
            zip.finish().expect("finish zip");
        }
        let result = read_archive(&path);
        assert!(result.is_ok());
        let archive = result.unwrap();
        assert!(!archive.files.is_empty());
    }

    #[test]
    fn test_is_image_file() {
        assert!(is_image_file("test.jpg"));
        assert!(is_image_file("test.jpeg"));
        assert!(is_image_file("test.png"));
        assert!(is_image_file("test.gif"));
        assert!(is_image_file("test.bmp"));
        assert!(is_image_file("test.webp"));
        assert!(is_image_file("TEST.JPG"));
        assert!(!is_image_file("test.txt"));
        assert!(!is_image_file("test.xml"));
        assert!(!is_image_file("ComicInfo.xml"));
    }

    #[test]
    fn test_load_cbz_failed_to_load_archive() {
        let path = test_path("does_not_exist.zip");
        let _ = std::fs::remove_file(&path);
        let result = commands::load_cbz_impl(None, path);
        assert!(result.error.is_some());
        assert!(result.image_files.is_empty());
        assert!(result.comic_info.is_none());
    }

    #[test]
    fn test_load_cbz_failed_to_parse_comicinfo_xml() {
        let path = test_path("test_invalid_comicinfo.cbz");
        let _ = std::fs::remove_file(&path);
        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("ComicInfo.xml", options)
                .expect("start file");
            zip.write_all(b"invalid xml").expect("write data");

            zip.finish().expect("finish zip");
        }
        let result = commands::load_cbz_impl(None, path.clone());
        assert!(result.error.is_some());
        let err = result.error.unwrap();
        assert!(err.message.contains("Failed to parse ComicInfo XML"));
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_get_raw_comicinfo_xml_and_validate() {
        let path = test_path("test_get_raw.cbz");
        let _ = std::fs::remove_file(&path);
        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            zip.start_file("ComicInfo.xml", options)
                .expect("start file");
            zip.write_all(
                br#"<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  <Title>Test</Title>
</ComicInfo>"#,
            )
            .expect("write data");

            zip.finish().expect("finish zip");
        }

        let result = get_raw_comicinfo_xml(path.clone()).unwrap();
        assert!(result.is_some());
        let xml = result.unwrap();
        assert!(xml.contains("<Title>Test</Title>"));

        let validation_result = crate::comicinfo::commands::validate_comicinfo_xml(xml.clone());
        assert!(validation_result.is_ok());

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_validate_comicinfo_xml_invalid() {
        let invalid_xml = r#"<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  <Pages>
    <Page Image="-1" />
  </Pages>
</ComicInfo>"#;

        let result = crate::comicinfo::commands::validate_comicinfo_xml(invalid_xml.to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_save_comicinfo_xml_valid_and_invalid() {
        let path = test_path("test_save_xml.cbz");
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

        let result = super::writer::save_comicinfo_xml_impl(path.clone(), valid_xml.to_string());
        assert!(result.is_ok());

        let invalid_xml = r#"not valid xml"#;
        let result = super::writer::save_comicinfo_xml_impl(path.clone(), invalid_xml.to_string());
        assert!(result.is_err());

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_delete_comicinfo_xml() {
        let path = test_path("test_delete.cbz");
        let _ = std::fs::remove_file(&path);

        // Create a zip with ComicInfo.xml and another file
        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);
            let options = zip::write::FileOptions::<()>::default()
                .compression_method(zip::CompressionMethod::Stored);
            zip.start_file("ComicInfo.xml", options)
                .expect("start file");
            zip.write_all(b"<ComicInfo></ComicInfo>")
                .expect("write xml");
            zip.start_file("image1.jpg", options).expect("start file");
            zip.write_all(b"fake image data").expect("write image");
            zip.finish().expect("finish zip");
        }

        // Delete ComicInfo.xml
        let result = super::writer::delete_comicinfo_xml(&path);
        assert!(result.is_ok());

        // Check that ComicInfo.xml is gone, image1.jpg remains
        let file = std::fs::File::open(&path).expect("open cbz");
        let mut archive = zip::ZipArchive::new(file).expect("open archive");
        let mut found_xml = false;
        let mut found_image = false;
        for i in 0..archive.len() {
            let name = archive.by_index(i).expect("by_index").name().to_string();
            if name == "ComicInfo.xml" {
                found_xml = true;
            }
            if name == "image1.jpg" {
                found_image = true;
            }
        }
        assert!(!found_xml);
        assert!(found_image);
    }

    #[test]
    fn test_save_page_settings_updates_three_and_preserves_others() {
        let path = test_path("test_update_partial.cbz");

        let _ = std::fs::remove_file(&path);

        // Create a cbz with 5 images and an initial ComicInfo.xml with 5 Page entries
        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            for i in 0..5 {
                let name = format!("image{}.jpg", i);
                zip.start_file(&name, options).expect("start file");
                zip.write_all(format!("fake image data {}", i).as_bytes())
                    .expect("write data");
            }

            // build initial ComicInfo.xml with 5 pages having distinct bookmarks
            let mut pages_xml = String::new();
            for i in 0..5 {
                pages_xml.push_str(&format!(
                    "    <Page Image=\"{}\" Type=\"Story\" Bookmark=\"orig-{}\" />\n",
                    i, i
                ));
            }

            let comicinfo = format!(
                "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<ComicInfo>\n  <Pages>\n{}  </Pages>\n</ComicInfo>",
                pages_xml
            );

            zip.start_file("ComicInfo.xml", options)
                .expect("start file");
            zip.write_all(comicinfo.as_bytes()).expect("write data");

            zip.finish().expect("finish zip");
        }

        // Prepare update for all 5 images (full replacement approach)
        // With the new architecture, frontend sends all pages it wants to keep
        let mut settings: HashMap<String, PageSettings> = HashMap::new();

        // Update pages 1, 2, and 4 with new values
        settings.insert(
            "image0.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::Story,
                double_page: false,
                bookmark: "orig-0".to_string(),
                image: 0,
            },
        );

        settings.insert(
            "image1.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::FrontCover,
                double_page: true,
                bookmark: "updated-1".to_string(),
                image: 1,
            },
        );

        settings.insert(
            "image2.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::Other,
                double_page: false,
                bookmark: "updated-2".to_string(),
                image: 2,
            },
        );

        settings.insert(
            "image3.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::Story,
                double_page: false,
                bookmark: "orig-3".to_string(),
                image: 3,
            },
        );

        settings.insert(
            "image4.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::BackCover,
                double_page: false,
                bookmark: "updated-4".to_string(),
                image: 4,
            },
        );

        let res = super::writer::save_page_settings_impl(path.clone(), settings);

        assert!(res.is_ok(), "save_page_settings failed: {:?}", res.err());

        // Read back ComicInfo.xml and assert there are still 5 pages and that 3 were updated
        let file = std::fs::File::open(&path).expect("open cbz");
        let mut archive = zip::ZipArchive::new(file).expect("open zip archive");
        let mut comic_file = archive.by_name("ComicInfo.xml").expect("comicinfo exists");
        let mut xml = String::new();
        comic_file.read_to_string(&mut xml).expect("read xml");

        let ci = ComicInfo::parse(&xml).expect("parse xml");
        assert!(ci.pages.is_some());
        let pages = ci.pages.unwrap().page;

        // The desired behavior: still 5 pages after partial update
        assert_eq!(pages.len(), 5, "expected 5 pages after update");

        // Helper to find page by image index
        let find_page = |img: i32| pages.iter().find(|p| p.image == img).cloned();

        // Check updated pages
        let p1 = find_page(1).expect("page 1 present");
        assert_eq!(p1.bookmark, "updated-1");
        assert!(p1.double_page);
        assert_eq!(p1.type_.unwrap(), ComicPageType::FrontCover);

        let p2 = find_page(2).expect("page 2 present");
        assert_eq!(p2.bookmark, "updated-2");
        assert!(!p2.double_page);
        // ComicPageType::Other is represented as None by from_page_settings, so expect None
        assert!(p2.type_.is_none());

        let p4 = find_page(4).expect("page 4 present");
        assert_eq!(p4.bookmark, "updated-4");
        assert_eq!(p4.type_.unwrap(), ComicPageType::BackCover);

        // Check unchanged pages still have original bookmarks
        let p0 = find_page(0).expect("page 0 present");
        assert_eq!(p0.bookmark, "orig-0");

        let p3 = find_page(3).expect("page 3 present");
        assert_eq!(p3.bookmark, "orig-3");

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn test_save_page_settings_skips_unset_images_without_originals() {
        let path = test_path("test_skip_unset.cbz");

        let _ = std::fs::remove_file(&path);

        // Create a cbz with 4 images and no ComicInfo.xml
        {
            let file = std::fs::File::create(&path).expect("create cbz");
            let mut zip = zip::ZipWriter::new(file);

            let options =
                ZipFileOptions::<()>::default().compression_method(ZipCompressionMethod::Stored);

            for i in 0..4 {
                let name = format!("image{}.jpg", i);
                zip.start_file(&name, options).expect("start file");
                zip.write_all(format!("fake image data {}", i).as_bytes())
                    .expect("write data");
            }

            zip.finish().expect("finish zip");
        }

        // Provide settings for only image0 and image2
        let mut settings: HashMap<String, PageSettings> = HashMap::new();

        settings.insert(
            "image0.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::FrontCover,
                double_page: false,
                bookmark: "note-0".to_string(),
                image: 0,
            },
        );

        settings.insert(
            "image2.jpg".to_string(),
            PageSettings {
                page_type: ComicPageType::Story,
                double_page: true,
                bookmark: "note-2".to_string(),
                image: 2,
            },
        );

        let res = super::writer::save_page_settings_impl(path.clone(), settings);
        assert!(res.is_ok(), "save_page_settings failed: {:?}", res.err());

        // Read back ComicInfo.xml and assert there are only 2 pages (for 0 and 2)
        let file = std::fs::File::open(&path).expect("open cbz");
        let mut archive = zip::ZipArchive::new(file).expect("open zip archive");
        let mut comic_file = archive.by_name("ComicInfo.xml").expect("comicinfo exists");
        let mut xml = String::new();
        comic_file.read_to_string(&mut xml).expect("read xml");

        let ci = ComicInfo::parse(&xml).expect("parse xml");
        assert!(ci.pages.is_some());
        let pages = ci.pages.unwrap().page;

        // Only pages for image0 and image2 should be present
        assert_eq!(pages.len(), 2, "expected only 2 pages to be created");

        let images: Vec<i32> = pages.iter().map(|p| p.image).collect();
        assert!(images.contains(&0), "page for image0 should exist");
        assert!(images.contains(&2), "page for image2 should exist");
        assert!(!images.contains(&1), "page for image1 should NOT exist");
        assert!(!images.contains(&3), "page for image3 should NOT exist");

        let _ = std::fs::remove_file(&path);
    }
}
