use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let _ = std::process::Command::new("python")
                    .args(&["backend/server.py"])
                    .spawn();
            }

            #[cfg(not(debug_assertions))]
            {
                let resource_dir = app.path().resource_dir().ok();
                let exe_dir = std::env::current_exe()
                    .ok()
                    .and_then(|p| p.parent().map(|p| p.to_path_buf()));

                let candidates = [
                    resource_dir.as_ref().map(|d| d.join("server.exe")),
                    exe_dir.as_ref().map(|d| d.join("server.exe")),
                    exe_dir.as_ref().map(|d| d.join("binaries").join("server-x86_64-pc-windows-msvc.exe")),
                    resource_dir.as_ref().map(|d| d.join("binaries").join("server-x86_64-pc-windows-msvc.exe")),
                ];

                for candidate in candidates.into_iter().flatten() {
                    if candidate.exists() {
                        let _ = std::process::Command::new(&candidate).spawn();
                        break;
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}