use dirs_next::data_dir;
use std::path::PathBuf;

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
