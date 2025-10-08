use crate::archive::manager::start_archive_watch_for_creation;

use super::manager::{start_archive_watcher, stop_archive_watcher};
use super::reader::{get_file_data, read_archive};
use super::types::{LoadCbzResponse, ToErrorResponse, is_image_file};
use super::writer::{delete_comicinfo_xml, save_comicinfo_xml_impl, save_page_settings_impl};
use log::debug;
use std::collections::HashMap;
use std::io::Read;

#[tauri::command]
pub fn load_cbz(app: tauri::AppHandle, path: String) -> LoadCbzResponse {
    load_cbz_impl(Some(app), path)
}

// Internal implementation that can be called with or without AppHandle for testing
pub(crate) fn load_cbz_impl(app: Option<tauri::AppHandle>, path: String) -> LoadCbzResponse {
    let archive = match read_archive(&path) {
        Ok(archive) => archive,
        Err(err) => {
            return LoadCbzResponse {
                image_files: vec![],
                comic_info: None,
                error: Some(err.to_error_response()),
            };
        }
    };

    let image_files = archive
        .files
        .iter()
        .filter(|f| is_image_file(&f.name))
        .map(|f| f.name.clone())
        .collect::<Vec<_>>();

    let mut sorted = image_files;
    sorted.sort();

    let comic_info = archive.comic_info;
    let error = None; // If validation is needed, handle here

    // Start watching this archive file (will restart if already watching)
    if let Some(app_handle) = app {
        if !start_archive_watcher(path.clone(), app_handle) {
            debug!("Failed to start watcher for {}", path);
        }
    }

    LoadCbzResponse {
        image_files: sorted,
        comic_info,
        error,
    }
}

#[tauri::command]
pub fn get_cbz_file_data(
    path: String,
    file_name: String,
) -> crate::archive::types::FileDataResponse {
    match get_file_data(&path, &file_name) {
        Ok(data) => crate::archive::types::FileDataResponse {
            data: Some(data),
            error: None,
        },
        Err(e) => crate::archive::types::FileDataResponse {
            data: None,
            error: Some(e.to_error_response()),
        },
    }
}

#[tauri::command]
pub fn get_comicinfo(path: String) -> Result<Option<String>, String> {
    let archive = read_archive(&path).map_err(|e| e.to_string())?;

    if let Some(comic_info) = &archive.comic_info {
        match comic_info.to_xml() {
            Ok(xml) => Ok(Some(xml)),
            Err(e) => {
                debug!("Failed to serialize ComicInfo to XML: {}", e);
                Err(format!("Failed to serialize ComicInfo: {}", e))
            }
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn save_page_settings(
    path: String,
    page_settings: HashMap<String, super::writer::PageSettings>,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || save_page_settings_impl(path, page_settings))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn get_raw_comicinfo_xml(path: String) -> Result<Option<String>, String> {
    let file = std::fs::File::open(&path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    let result = archive.by_name("ComicInfo.xml");
    match result {
        Ok(mut comic_info_file) => {
            let mut xml_content = String::new();
            comic_info_file
                .read_to_string(&mut xml_content)
                .map_err(|e| e.to_string())?;
            Ok(Some(xml_content))
        }
        Err(zip::result::ZipError::FileNotFound) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn save_comicinfo_xml(path: String, xml: String) -> Result<String, String> {
    save_comicinfo_xml_impl(path, xml)
}

#[tauri::command]
pub fn delete_cbz_comicinfo_xml(path: String) -> Result<(), String> {
    delete_comicinfo_xml(&path)
}

#[tauri::command]
pub fn unload_cbz(path: String) -> Result<(), String> {
    stop_archive_watcher(&path)
}

#[tauri::command]
pub fn watch_for_creation(app: tauri::AppHandle, path: String) -> Result<(), String> {
    if start_archive_watch_for_creation(app, path.clone()) {
        Ok(())
    } else {
        Err(format!("Failed to start watcher for {}", path))
    }
}
