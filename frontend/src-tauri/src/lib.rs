use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

struct SidecarProcess(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

impl Drop for SidecarProcess {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.0.lock() {
            if let Some(child) = guard.take() {
                let _ = child.kill();
            }
        }
    }
}

#[tauri::command]
fn kill_sidecar(state: tauri::State<SidecarProcess>) {
    if let Ok(mut guard) = state.0.lock() {
        if let Some(child) = guard.take() {
            log::info!("[Tauri] Killing posweb-backend sidecar before update...");
            let _ = child.kill();
        } else {
            log::info!("[Tauri] Sidecar already stopped, nothing to kill");
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![kill_sidecar])
        .setup(|app| {
            // Log plugin only in debug
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Kill any orphan backend from previous crashed session
            let _ = std::process::Command::new("taskkill")
                .args(["/f", "/im", "posweb-backend.exe"])
                .output();

            // Log sidecar spawn
            log::info!("[Tauri] Spawning posweb-backend sidecar...");

            // Spawn .NET backend as sidecar
            let sidecar = app.shell().sidecar("posweb-backend")
                .expect("failed to create sidecar command");
            let (mut rx, child) = sidecar.spawn()
                .expect("failed to spawn backend sidecar");

            app.manage(SidecarProcess(Mutex::new(Some(child))));

            // Log backend output
            tauri::async_runtime::spawn(async move {
                use tauri_plugin_shell::process::CommandEvent;
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            log::info!("[backend] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Stderr(line) => {
                            log::error!("[backend] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Terminated(payload) => {
                            log::warn!("[Tauri] posweb-backend sidecar exited with code {:?}", payload.code);
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
