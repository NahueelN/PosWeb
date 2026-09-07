use std::sync::Mutex;
use serde::Serialize;
use keyring::Entry;
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            kill_sidecar,
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
