// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn greet(name: &str) -> String {
    format!("DeepRepo dark side initialized for {}", name)
}

#[tauri::command]
fn check_system() -> serde_json::Value {
    serde_json::json!({
        "status": "ready",
        "app": "DeepRepo - The Dark Side",
        "version": "0.1.0",
        "os": std::env::consts::OS
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, check_system])
        .run(tauri::generate_context!())
        .expect("error while running DeepRepo desktop application");
}
