use dirs_next::data_dir;
use std::path::PathBuf;
use std::sync::Mutex;

pub static RESOURCE_DIR: Mutex<Option<PathBuf>> = Mutex::new(None);

pub fn set_resource_dir(resource_dir: Option<PathBuf>) {
    *RESOURCE_DIR.lock().unwrap() = resource_dir;
}

pub fn get_storage_path() -> PathBuf {
    let mut path = data_dir().expect("No data dir found");
    path.push("ImageVault");
    std::fs::create_dir_all(&path).unwrap();
    path
}

pub fn get_image_path() -> PathBuf {
    let mut path = data_dir().expect("No data dir found");
    path.push("ImageVault/Images");
    std::fs::create_dir_all(&path).unwrap();
    path
}

pub fn get_tesseract_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    Ok(RESOURCE_DIR
        .lock()
        .unwrap()
        .as_ref()
        .ok_or("Could not find resources dir")?
        .join("tesseract")
        .join("tesseract.exe"))
}
