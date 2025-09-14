use rusqlite::{Connection, Result, params};

use crate::utils::file_utils;

use std::fs;

const MIGRATIONS: &[&str] = &["CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    tags TEXT,
    ocr_test TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
)"];

fn sync_from_files(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let dir = file_utils::get_image_path();

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let filename = path.to_string_lossy().to_string();

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
                conn.execute(
                    "INSERT INTO images (filename, path) VALUES (?1, ?2)",
                    params![filename, ""],
                )?;
            }
            Err(e) => return Err(Box::new(e)),
        }
    }

    Ok(())
}

pub fn init_db() -> Result<Connection, Box<dyn std::error::Error>> {
    let mut db_path = file_utils::get_storage_path();
    db_path.push("imagevault.db");
    let conn = Connection::open(db_path)?;

    for migration in MIGRATIONS {
        conn.execute(migration, [])?;
    }

    sync_from_files(&conn)?;

    Ok(conn)
}
