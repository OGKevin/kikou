#[cfg_attr(mobile, tauri::mobile_entry_point)]
mod archive;
mod comicinfo;
pub mod error;
pub mod library;

use library::commands::LibraryState;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(LibraryState::default())
        .invoke_handler(tauri::generate_handler![
            archive::load_cbz,
            archive::unload_cbz,
            archive::get_cbz_file_data,
            archive::get_comicinfo,
            archive::save_page_settings,
            archive::get_raw_comicinfo_xml,
            archive::save_comicinfo_xml,
            archive::delete_cbz_comicinfo_xml,
            archive::commands::watch_for_creation,
            archive::commands::stream_file_data,
            comicinfo::commands::get_bookmarked_pages,
            comicinfo::commands::validate_comicinfo_xml,
            comicinfo::commands::format_comicinfo_xml,
            library::commands::library_open,
            library::commands::library_get_all_books,
            library::commands::library_get_book,
            library::commands::library_get_book_count,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                use tauri::Manager;

                if let Some(window) = app.handle().get_webview_window("main") {
                    window.open_devtools();
                }

                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Debug)
                        .target(tauri_plugin_log::Target::new(
                            tauri_plugin_log::TargetKind::Webview,
                        ))
                        .build(),
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
