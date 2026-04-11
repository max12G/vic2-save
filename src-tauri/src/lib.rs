#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init()) 
        .setup(|app| {
            // Запускаем ML-движок только если активна фича full_analysis
            #[cfg(feature = "full_analysis")]
            {
                #[cfg(debug_assertions)]
                {
                    // В режиме разработки запускаем просто через python
                    let mut cmd = std::process::Command::new("python");
                    cmd.args(&["backend/server.py"]);
                    
                    #[cfg(windows)]
                    cmd.creation_flags(0x08000000);
                    
                    let _ = cmd.spawn();
                }

                #[cfg(not(debug_assertions))]
                {
                    let _ = app.shell()
                        .sidecar("server")
                        .expect("Не удалось найти бинарник сервера")
                        .spawn();
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}