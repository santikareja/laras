// Rust minimal (ARCH 4.1): menyiapkan jendela dan plugin shell untuk sidecar, tanpa logika bisnis.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("gagal menjalankan aplikasi Tauri");
}
