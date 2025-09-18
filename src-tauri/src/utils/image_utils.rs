use crate::utils::path_utils;

use std::process::Command;

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
