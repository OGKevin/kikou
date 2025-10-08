use super::get_bookmarked_pages as super_get_bookmarked_pages;
use super::info::ComicInfo;
use crate::archive::read_archive;

#[tauri::command]
pub async fn get_bookmarked_pages(path: String) -> Result<Vec<String>, String> {
    let archive = read_archive(&path).map_err(|e| e.to_string())?;

    if let Some(comic_info) = &archive.comic_info {
        let image_files = archive
            .files
            .iter()
            .filter(|f| crate::archive::is_image_file(&f.name))
            .map(|f| f.name.clone())
            .collect::<Vec<_>>();

        let mut sorted = image_files;
        sorted.sort();

        Ok(super_get_bookmarked_pages(comic_info, &sorted))
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn validate_comicinfo_xml(xml: String) -> Result<(), String> {
    let comic_info = ComicInfo::parse(&xml).map_err(|e| format!("Parse error: {}", e))?;
    comic_info
        .validate()
        .map_err(|e| format!("Validation error: {}", e))
}

#[tauri::command]
pub fn format_comicinfo_xml(xml: String) -> Result<String, String> {
    super::info::format_comicinfo_xml_str(&xml)
}
