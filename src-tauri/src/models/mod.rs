pub mod image;

#[derive(serde::Serialize)]
pub struct Image {
    pub id: i64,
    pub path: String,
    pub tags: String,
    pub ocr_text: String,
}