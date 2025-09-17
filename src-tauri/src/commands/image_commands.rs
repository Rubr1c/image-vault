use crate::{db::database::Db, models::image::Image};
use rusqlite::{OptionalExtension, params};

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
