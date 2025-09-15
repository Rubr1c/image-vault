use crate::utils::file_utils;
use rusqlite::{Connection, Result, params};
use std::fs;
use std::sync::Mutex;

pub struct Db(pub Mutex<Connection>);

pub const MIGRATIONS: &[&str] = &["CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    tags TEXT,
    ocr_text TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
)"];

pub fn sync_from_files(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let dir = file_utils::get_image_path();

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let filename = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("")
            .to_string();

        let exists: Result<i64, _> = conn.query_row(
            "SELECT id FROM images WHERE filename = ?1",
            params![filename],
            |row| row.get(0),
        );

        match exists {
            Ok(_) => {
                // already exists, do nothing
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                let full_path = path.to_string_lossy().to_string();
                conn.execute(
                    "INSERT INTO images (filename, path) VALUES (?1, ?2)",
                    params![filename, full_path],
                )?;
            }
            Err(e) => return Err(Box::new(e)),
        }
    }

    Ok(())
}
