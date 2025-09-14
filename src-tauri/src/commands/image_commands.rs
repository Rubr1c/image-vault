use crate::{db::database::Db, models::image::Image};
use rusqlite::params;

#[tauri::command]
pub fn get_images(db: tauri::State<Db>) -> Result<Vec<Image>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, filename, path, tags, ocr_text, added_at FROM images")
        .map_err(|e| e.to_string())?;

    let image_iter = stmt
        .query_map(params![], |row| {
            Ok(Image {
                id: row.get(0)?,
                filename: row.get(1)?,
                path: row.get(2)?,
                tags: row.get(3)?,
                ocr_text: row.get(4)?,
                added_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut images = Vec::new();
    for image in image_iter {
        images.push(image.map_err(|e| e.to_string())?);
    }

    Ok(images)
}
