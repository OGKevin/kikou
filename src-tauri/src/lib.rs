#[cfg_attr(mobile, tauri::mobile_entry_point)]
mod archive;
mod comicinfo;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
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
            comicinfo::commands::get_bookmarked_pages,
            comicinfo::commands::validate_comicinfo_xml,
            comicinfo::commands::format_comicinfo_xml,
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
