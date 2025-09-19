use crate::models::sync_folder::SyncFolder;
use crate::utils::image_utils;
use crate::utils::path_utils;
use rusqlite::{Connection, Result, params};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Db(pub Mutex<Connection>);

pub const MIGRATIONS: &[&str] = &[
    "CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        path TEXT NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE VIRTUAL TABLE IF NOT EXISTS image_search USING fts5(
        search_text
    )",
    "CREATE TABLE IF NOT EXISTS sync_folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        move_images BOOLEAN DEFAULT FALSE
    )",
];

pub fn add_image(
    conn: &Connection,
    filename: &str,
    full_path: &str,
) -> Result<i64, Box<dyn std::error::Error>> {
    conn.execute(
        "INSERT INTO images (filename, path) VALUES (?1, ?2)",
        params![filename, full_path],
    )?;

    let image_id = conn.last_insert_rowid();
    let text = image_utils::extract_text_from_image(full_path).unwrap_or_else(|e| {
        eprintln!("Warning: Could not extract text from {}: {}", filename, e);
        String::new()
    });
    conn.execute(
        "INSERT INTO image_search (rowid, search_text) VALUES (?1, ?2)",
        params![image_id, text],
    )?;

    println!("Extracted text from {}: {}", filename, text);
    Ok(image_id)
}

pub fn sync_from_files(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let dir = path_utils::get_image_path();

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
                add_image(conn, &filename, &full_path)?;
            }
            Err(e) => return Err(Box::new(e)),
        }
    }

    Ok(())
}

pub fn add_sync_folder(
    conn: &Connection,
    path: String,
    move_images: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    conn.execute(
        "INSERT INTO sync_folders (path, move_images) VALUES (?1, ?2)",
        params![path, move_images],
    )?;
    Ok(())
}

pub fn run_folder_sync(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let mut stmt = conn.prepare("SELECT id, path, move_images FROM sync_folders")?;
    let sync_folders: Vec<SyncFolder> = stmt
        .query_map([], |row| {
            Ok(SyncFolder {
                id: row.get(0)?,
                path: row.get(1)?,
                move_images: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    for sync_folder in sync_folders {
        let dir = PathBuf::from(sync_folder.path);
        let entries = fs::read_dir(dir)?;
        for entry in entries {
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
                }
                Err(rusqlite::Error::QueryReturnedNoRows) => {
                    let full_path = path.to_string_lossy().to_string();
                    add_image(conn, &filename, &full_path)?;
                }
                Err(e) => return Err(Box::new(e)),
            }
        }
    }

    Ok(())
}
