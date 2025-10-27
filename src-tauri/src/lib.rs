// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "windows")]
mod snap_layouts;

use tauri::Manager;

// 触发 Windows 11 Snap Layouts
#[tauri::command]
fn trigger_snap_layouts() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        snap_layouts::trigger_snap_layouts()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            println!("✓ 窗口已初始化: {:?}", window.label());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![trigger_snap_layouts])
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
