use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                std::process::Command::new("python")
                    .args(&["backend/server.py"])
                    .spawn()
                    .expect("failed to start python server");
            }

            #[cfg(not(debug_assertions))]
            {
                let binary_path = app.path().resource_dir()
                    .expect("failed to get resource dir")
                    .join("binaries")
                    .join("server-x86_64-pc-windows-msvc.exe");

                std::process::Command::new(&binary_path)
                    .spawn()
                    .expect("failed to start server");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}