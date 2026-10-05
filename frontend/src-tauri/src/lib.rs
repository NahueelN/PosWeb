use std::sync::Mutex;
use serde::Serialize;
use keyring::Entry;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

struct SidecarProcesses(Mutex<Vec<tauri_plugin_shell::process::CommandChild>>);

impl Drop for SidecarProcesses {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.0.lock() {
            for child in guard.drain(..) {
                let _ = child.kill();
            }
        }
    }
}

const CRED_SERVICE: &str = "posweb";
const CRED_USER_SLOT: &str = "login_usuario";
const CRED_PASS_SLOT: &str = "login_password";

#[derive(Serialize)]
struct CredencialesGuardadas {
    usuario: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    password: Option<String>,
}

fn cred_entry(slot: &str) -> Result<Entry, String> {
    Entry::new(CRED_SERVICE, slot).map_err(|e| e.to_string())
}

/// Guarda usuario + contraseña (opción "Recordarme").
#[tauri::command]
fn guardar_credenciales(usuario: String, password: String) -> Result<(), String> {
    cred_entry(CRED_USER_SLOT)?.set_password(&usuario).map_err(|e| e.to_string())?;
    cred_entry(CRED_PASS_SLOT)?.set_password(&password).map_err(|e| e.to_string())
}

/// Guarda solo el usuario (sin recordar contraseña) y borra la contraseña previa.
#[tauri::command]
fn guardar_usuario(usuario: String) -> Result<(), String> {
    cred_entry(CRED_USER_SLOT)?.set_password(&usuario).map_err(|e| e.to_string())?;
    let _ = cred_entry(CRED_PASS_SLOT)?.delete_credential();
    Ok(())
}

/// Devuelve las credenciales guardadas (usuario y contraseña si existe).
#[tauri::command]
fn obtener_credenciales() -> Result<Option<CredencialesGuardadas>, String> {
    let usuario = match cred_entry(CRED_USER_SLOT).and_then(|e| e.get_password().map_err(|e| e.to_string())) {
        Ok(u) => u,
        Err(_) => return Ok(None),
    };
    let password = cred_entry(CRED_PASS_SLOT)
        .and_then(|e| e.get_password().map_err(|e| e.to_string()))
        .ok();
    Ok(Some(CredencialesGuardadas { usuario, password }))
}

/// Borra usuario y contraseña guardados.
#[tauri::command]
fn borrar_credenciales() -> Result<(), String> {
    let _ = cred_entry(CRED_USER_SLOT)?.delete_credential();
    let _ = cred_entry(CRED_PASS_SLOT)?.delete_credential();
    Ok(())
}

#[tauri::command]
fn cerrar_ventana_impresion(webview_window: tauri::WebviewWindow) -> Result<(), String> {
    if webview_window.label() == "main" {
        return Err("La ventana principal no puede cerrarse como ventana de impresión".to_string());
    }

    webview_window.destroy().map_err(|e| e.to_string())
}

#[tauri::command]
fn kill_sidecars(state: tauri::State<SidecarProcesses>) {
    if let Ok(mut guard) = state.0.lock() {
        if !guard.is_empty() {
            log::info!("[Tauri] Killing sidecars before update...");
            for child in guard.drain(..) {
                let _ = child.kill();
            }
            let _ = std::process::Command::new("taskkill")
                .args(["/f", "/im", "posweb-backend.exe"])
                .output();
            let _ = std::process::Command::new("taskkill")
                .args(["/f", "/im", "vendeto-mobile.exe"])
                .output();
        } else {
            log::info!("[Tauri] Sidecars already stopped, nothing to kill");
        }
    }
}

#[tauri::command]
fn reiniciar_aplicacion(app: tauri::AppHandle) {
    app.restart();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            kill_sidecars,
            reiniciar_aplicacion,
            guardar_credenciales,
            guardar_usuario,
            obtener_credenciales,
            borrar_credenciales,
            cerrar_ventana_impresion
        ])
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
            let _ = std::process::Command::new("taskkill")
                .args(["/f", "/im", "vendeto-mobile.exe"])
                .output();

            // Log sidecar spawn
            log::info!("[Tauri] Spawning posweb-backend sidecar...");

            // Spawn .NET backend as sidecar
            let sidecar = app.shell().sidecar("posweb-backend")
                .expect("failed to create sidecar command");
            let (mut backend_rx, backend_child) = sidecar.spawn()
                .expect("failed to spawn backend sidecar");

            // Log backend output
            tauri::async_runtime::spawn(async move {
                use tauri_plugin_shell::process::CommandEvent;
                while let Some(event) = backend_rx.recv().await {
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

            log::info!("[Tauri] Spawning vendeto-mobile sidecar...");
            let mobile_sidecar = app.shell().sidecar("vendeto-mobile")
                .expect("failed to create Vendeto Mobile sidecar command");
            let (mut mobile_rx, mobile_child) = match mobile_sidecar.spawn() {
                Ok(process) => process,
                Err(error) => {
                    let _ = backend_child.kill();
                    return Err(error.into());
                }
            };

            tauri::async_runtime::spawn(async move {
                use tauri_plugin_shell::process::CommandEvent;
                while let Some(event) = mobile_rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            log::info!("[vendeto-mobile] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Stderr(line) => {
                            log::error!("[vendeto-mobile] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Terminated(payload) => {
                            log::warn!("[Tauri] vendeto-mobile sidecar exited with code {:?}", payload.code);
                        }
                        _ => {}
                    }
                }
            });

            app.manage(SidecarProcesses(Mutex::new(vec![backend_child, mobile_child])));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
