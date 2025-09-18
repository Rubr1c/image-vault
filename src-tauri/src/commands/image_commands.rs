use std::path::PathBuf;

use crate::{
    db::database::{self, Db},
    models::image::Image,
    utils::image_utils,
};
use rusqlite::{OptionalExtension, params};

fn sanitize_fts_token(token: &str) -> String {
    token
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
        .collect()
}

#[tauri::command]
pub fn get_images(db: tauri::State<Db>) -> Result<Vec<Image>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, filename, path, added_at FROM images")
        .map_err(|e| e.to_string())?;

    let image_iter = stmt
        .query_map(params![], |row| {
            Ok(Image {
                id: row.get(0)?,
                filename: row.get(1)?,
                path: row.get(2)?,
                added_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut images = Vec::new();
    for image in image_iter {
        images.push(image.map_err(|e| e.to_string())?);
    }

    Ok(images)
}

#[tauri::command]
pub fn add_tag(db: tauri::State<Db>, image_id: i64, new_tag: &str) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;

    let trimmed = new_tag.trim();
    if trimmed.is_empty() {
        return Ok(());
    }

    let existing: Option<String> = conn
        .query_row(
            "SELECT search_text FROM image_search WHERE rowid = ?1",
            [image_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    let new_text = match existing {
        Some(current) => {
            // If tag already present, no-op
            let has_tag = current.split_whitespace().any(|t| t == trimmed);
            if has_tag {
                return Ok(());
            }
            if current.is_empty() {
                trimmed.to_string()
            } else {
                format!("{} {}", current, trimmed)
            }
        }
        None => trimmed.to_string(),
    };

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM image_search WHERE rowid = ?1", [image_id])
        .map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO image_search (rowid, search_text) VALUES (?1, ?2)",
        (image_id, new_text),
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_tags(db: tauri::State<Db>, image_id: i64) -> Result<Vec<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT search_text FROM image_search WHERE rowid = ?1")
        .map_err(|e| e.to_string())?;

    let tag_iter = stmt
        .query_map([image_id], |row| {
            let search_text: String = row.get(0)?;
            Ok(search_text)
        })
        .map_err(|e| e.to_string())?;

    let mut all_tags = Vec::new();
    for tag_result in tag_iter {
        let tag_text = tag_result.map_err(|e| e.to_string())?;
        for tag in tag_text.split_whitespace() {
            if !tag.is_empty() {
                all_tags.push(tag.to_string());
            }
        }
    }

    all_tags.sort();
    all_tags.dedup();

    Ok(all_tags)
}

#[tauri::command]
pub fn search_images(db: tauri::State<Db>, tag: &str) -> Result<Vec<Image>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT images.id, images.filename, images.path, images.added_at
         FROM image_search
         JOIN images ON images.id = image_search.rowid
         WHERE image_search MATCH ?1",
        )
        .map_err(|e| e.to_string())?;

    let query = tag
        .split_whitespace()
        .filter(|t| !t.is_empty())
        .map(|t| {
            let t = sanitize_fts_token(t);
            if t.is_empty() { t } else { format!("{}*", t) }
        })
        .filter(|t| !t.is_empty())
        .collect::<Vec<_>>()
        .join(" ");

    let image_iter = stmt
        .query_map([query], |row| {
            Ok(Image {
                id: row.get(0)?,
                filename: row.get(1)?,
                path: row.get(2)?,
                added_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut images = Vec::new();
    for image in image_iter {
        images.push(image.map_err(|e| e.to_string())?);
    }

    Ok(images)
}

#[tauri::command]
pub fn ocr_retry(db: tauri::State<Db>, image_id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT path FROM images WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let path: String = stmt
        .query_row([image_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let text = image_utils::extract_text_from_image(&path).map_err(|e| e.to_string())?;

    drop(stmt);
    conn.execute(
        "UPDATE image_search SET search_text = ?1 WHERE rowid = ?2",
        (text, image_id),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn remove_tag(db: tauri::State<Db>, image_id: i64, tag: &str) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("DELETE FROM image_search WHERE rowid = ?1 AND search_text = ?2")
        .map_err(|e| e.to_string())?;

    let trimmed = tag.trim();
    if trimmed.is_empty() {
        return Ok(());
    }

    stmt.execute((image_id, trimmed))
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn save_image_from_path(
    db: tauri::State<Db>,
    path: &str,
    move_image: bool,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let new_path = image_utils::save_local_image(PathBuf::from(path), move_image)
        .map_err(|e| e.to_string())?;

    println!("Adding image to database: {:?}", new_path);
    database::add_image(
        &conn,
        new_path
            .file_name()
            .ok_or("Invalid filename")?
            .to_str()
            .ok_or("Invalid filename")?,
        new_path.to_str().ok_or("Invalid path")?,
    )
    .map_err(|e| e.to_string())?;

    println!("Image added to database: {:?}", new_path);
    Ok(())
}
