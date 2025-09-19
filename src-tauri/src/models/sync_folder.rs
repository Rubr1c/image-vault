use serde::Serialize;

#[derive(Serialize)]
pub struct SyncFolder {
    pub id: i64,
    pub path: String,
    pub move_images: bool,
}

