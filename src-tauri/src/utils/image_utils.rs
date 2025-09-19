use crate::utils::path_utils;

use std::{path::PathBuf, process::Command};

pub fn extract_text_from_image(image_path: &str) -> Result<String, Box<dyn std::error::Error>> {
    let exe_path = path_utils::get_tesseract_path()?;
    let tessdata_dir = exe_path.parent().unwrap().join("tessdata");

    // Convert UNC path to regular Windows path for Tesseract compatibility
    let tessdata_str = tessdata_dir.to_string_lossy().replace(r"\\?\", "");

    let output = Command::new(exe_path)
        .arg(image_path)
        .arg("stdout") // Output to stdout instead of file
        .env("TESSDATA_PREFIX", tessdata_str)
        .output()?;

    if !output.status.success() {
        return Err(format!(
            "Tesseract failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )
        .into());
    }

    Ok(String::from_utf8(output.stdout)?)
}

pub fn save_local_image(
    path: PathBuf,
    move_image: bool,
) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let image_path = path_utils::get_image_path();
    let image_path = image_path.join(path.file_name().ok_or("Invalid filename")?);

    // Generate unique filename if target already exists
    let mut final_path = image_path.clone();
    let mut counter = 1;

    while final_path.exists() {
        let stem = image_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("image");
        let extension = image_path
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("");
        let new_filename = if extension.is_empty() {
            format!("{} ({})", stem, counter)
        } else {
            format!("{} ({}).{}", stem, counter, extension)
        };
        final_path = image_path.parent().unwrap().join(new_filename);
        counter += 1;
    }

    if move_image {
        std::fs::rename(&path, &final_path)?;
    } else {
        std::fs::copy(&path, &final_path)?;
    }

    Ok(final_path)
}

pub async fn save_image_from_url(url: String) -> Result<PathBuf, Box<dyn std::error::Error>> {
    use regex::Regex;
    use reqwest::Client;
    use std::fs;
    use std::path::Path;

    let client = Client::new();
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;

    // Extract filename from URL, fallback to timestamped name if invalid
    let mut filename = url.split('/').last().unwrap_or("image.jpg").to_string();

    // Remove query parameters and fragments
    if let Some(idx) = filename.find(['?', '#'].as_ref()) {
        filename.truncate(idx);
    }

    // If filename is empty or only an extension, fallback to timestamped name
    if filename.trim().is_empty() || filename.starts_with('.') {
        filename = format!("fetched_{}.jpg", chrono::Utc::now().timestamp());
    }

    // Remove invalid characters for Windows and other OSes
    // Windows: <>:"/\|?* and ASCII control chars (0-31)
    let re = Regex::new(r#"[<>:"/\\|?*\x00-\x1F]"#).unwrap();
    filename = re.replace_all(&filename, "_").to_string();

    // If filename is still empty, fallback
    if filename.trim().is_empty() {
        filename = format!("fetched_{}.jpg", chrono::Utc::now().timestamp());
    }

    // If filename is a directory, fallback
    if Path::new(&filename).components().count() != 1 {
        filename = format!("fetched_{}.jpg", chrono::Utc::now().timestamp());
    }

    let mut path = path_utils::get_image_path();
    path.push(&filename);

    fs::write(&path, &bytes).map_err(|e| e.to_string())?;

    Ok(path)
}
