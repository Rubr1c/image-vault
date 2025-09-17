use serde::Serialize;

#[derive(Serialize)]
pub struct Image {
    pub id: i64,
    pub filename: String,
    pub path: String,
    pub added_at: String,
}
