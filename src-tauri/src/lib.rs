pub mod commands;
pub mod db;
pub mod models;
pub mod utils;

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

use {
    commands::image_commands,
    db::database::{self, Db},
    utils::file_utils,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = file_utils::get_storage_path().join("imagevault.db");
            let conn = Connection::open(db_path).expect("Failed to open DB");

            for migration in database::MIGRATIONS {
                conn.execute(migration, []).expect("Migration failed");
            }

            database::sync_from_files(&conn)?;

            app.manage(Db(Mutex::new(conn)));

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            image_commands::get_images,
            image_commands::add_tag,
            image_commands::get_tags,
            image_commands::search_images,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
