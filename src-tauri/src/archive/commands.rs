use crate::archive::manager::start_archive_watch_for_creation;

use super::manager::{start_archive_watcher, stop_archive_watcher};
use super::reader::{get_file_data, read_archive, stream_file_data_from_archive};
use super::types::{LoadCbzResponse, ToErrorResponse, is_image_file};
use super::writer::{delete_comicinfo_xml, save_comicinfo_xml_impl, save_page_settings_impl};
use base64::{Engine, engine::general_purpose::STANDARD as BASE64_STANDARD};
use log::debug;
use serde::Serialize;
use std::collections::HashMap;
use std::io::Read;
use tauri::ipc::Channel;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum StreamProgressEvent {
    Started {
        total_files: usize,
    },
    Preview {
        file_name: String,
        data_raw: Vec<u8>,
        data_base64: String,
    },
    Error {
        file_name: String,
        message: String,
    },
    Finished,
}

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
pub fn get_comicinfo(path: String) -> Result<Option<crate::comicinfo::ComicInfo>, String> {
    let archive = read_archive(&path).map_err(|e| e.to_string())?;
    Ok(archive.comic_info)
}

#[tauri::command]
pub async fn save_page_settings(
    path: String,
    page_settings: HashMap<String, super::writer::PageSettings>,
) -> Result<Vec<crate::comicinfo::ComicPageInfo>, String> {
    let path_clone = path.clone();
    tauri::async_runtime::spawn_blocking(move || {
        save_page_settings_impl(path_clone, page_settings)
    })
    .await
    .map_err(|e| e.to_string())??;

    let archive = super::reader::read_archive(&path).map_err(|e| e.to_string())?;
    let pages = archive
        .comic_info
        .and_then(|ci| ci.pages)
        .map(|pages| pages.page)
        .unwrap_or_default();

    Ok(pages)
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

#[tauri::command]
pub async fn stream_file_data(
    path: String,
    file_names: Vec<String>,
    on_event: Channel<StreamProgressEvent>,
) {
    tauri::async_runtime::spawn_blocking(move || {
        let total = file_names.len();
        if let Err(e) = on_event.send(StreamProgressEvent::Started { total_files: total }) {
            debug!("Failed to send Started event: {}", e);
            return;
        }

        use std::sync::Arc;
        let on_event = Arc::new(on_event);

        let on_event_data = Arc::clone(&on_event);
        let on_data = move |file_name, data: Vec<u8>| {
            let data_base64 = BASE64_STANDARD.encode(&data);

            if let Err(e) = on_event_data.send(StreamProgressEvent::Preview {
                file_name,
                data_raw: data,
                data_base64,
            }) {
                debug!("Failed to send Preview event: {}", e);
            }
        };

        let on_event_error = Arc::clone(&on_event);
        let on_error = move |file_name, message| {
            if let Err(e) = on_event_error.send(StreamProgressEvent::Error { file_name, message }) {
                debug!("Failed to send Error event: {}", e);
            }
        };

        if let Err(e) = stream_file_data_from_archive(&path, file_names, on_data, on_error) {
            let _ = on_event.send(StreamProgressEvent::Error {
                file_name: path,
                message: e.to_string(),
            });
        }

        if let Err(e) = on_event.send(StreamProgressEvent::Finished) {
            debug!("Failed to send Finished event: {}", e);
        }
    })
    .await
    .ok();
}
