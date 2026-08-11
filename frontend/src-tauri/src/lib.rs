use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri_plugin_shell::ShellExt;

struct SidecarProcess(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

struct ExitConfirmed(AtomicBool);

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
            let _ = std::process::Command::new("taskkill")
                .args(["/f", "/im", "posweb-backend.exe"])
                .output();
        } else {
            log::info!("[Tauri] Sidecar already stopped, nothing to kill");
        }
    }
}

#[tauri::command]
fn confirm_exit(app: tauri::AppHandle, state: tauri::State<ExitConfirmed>) {
    log::info!("[Tauri] Exit confirmed by user, closing application");
    state.0.store(true, Ordering::SeqCst);
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![kill_sidecar, confirm_exit])
        .setup(|app| {
            // Log plugin only in debug
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Confirm-exit gate state
            app.manage(ExitConfirmed(AtomicBool::new(false)));

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
        .on_window_event(|window, event| {
            // Ask for confirmation before the window closes (X button, Alt+F4)
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let confirmed = window.state::<ExitConfirmed>().0.load(Ordering::SeqCst);
                if !confirmed {
                    api.prevent_close();
                    log::info!("[Tauri] Window close requested — asking user for confirmation");
                    let _ = window.emit("app-close-requested", ());
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            // Safety net: also intercept a full app exit (e.g. taskkill, OS shutdown)
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                let confirmed = app_handle.state::<ExitConfirmed>().0.load(Ordering::SeqCst);
                if !confirmed {
                    api.prevent_exit();
                    log::info!("[Tauri] Exit requested — asking user for confirmation");
                    let _ = app_handle.emit("app-close-requested", ());
                }
            }
        });
}
