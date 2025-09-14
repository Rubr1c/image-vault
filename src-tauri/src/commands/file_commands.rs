use crate::utils::file_utils;
use std::fs;

#[tauri::command]
pub fn get_files() -> Result<Vec<String>, String> {
    todo!()
}
