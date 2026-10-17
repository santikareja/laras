// Rust minimal (ARCH 4.1): hanya menyiapkan jendela, tanpa logika bisnis.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("gagal menjalankan aplikasi Tauri");
}
