use crate::utils::file_utils;
use rusqlite::OptionalExtension;
use rusqlite::{Connection, Result, params};
use std::fs;
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
];

pub fn ensure_search_table(conn: &Connection) -> rusqlite::Result<()> {
    let sql_def: Option<String> = conn
        .query_row(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='image_search'",
            [],
            |row| row.get(0),
        )
        .optional()?;

    match sql_def {
        Some(definition) => {
            if definition.contains("content='images'") {
                conn.execute("DROP TABLE image_search", [])?;
                conn.execute(
                    "CREATE VIRTUAL TABLE image_search USING fts5(search_text)",
                    [],
                )?;
            }
        }
        None => {
            conn.execute(
                "CREATE VIRTUAL TABLE image_search USING fts5(search_text)",
                [],
            )?;
        }
    }

    Ok(())
}

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
