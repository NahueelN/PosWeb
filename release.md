# Release de PosWeb

Guía para crear un nuevo release de la app de escritorio (Tauri + auto-updater).

## Arquitectura

- El release se dispara desde GitHub con un **tag** `v*`.
- El workflow `.github/workflows/release.yml` compila el backend .NET (sidecar) y el bundle Tauri, sube el instalador a un release de GitHub y regenera `latest.json`.
- La app chequea `latest.json` (endpoint configurado en `tauri.conf.json` → `raw.githubusercontent.com/NahueelN/PosWeb/master/latest.json`) y se auto-actualiza con el plugin updater de Tauri.

## Checklist para crear un release

### 1. Bump de versión

Cambiar `X.Y.Z` al nuevo número en los **3 archivos** (siempre el mismo valor):

- `frontend/src-tauri/tauri.conf.json` → `"version": "X.Y.Z"`
- `frontend/src-tauri/Cargo.toml` → `version = "X.Y.Z"`
- `frontend/src-tauri/Cargo.lock` → en la entrada `[[package]] name = "app"` → `version = "X.Y.Z"`

> No hace falta tocar `frontend/package.json` (está en `0.0.0` y no se usa para versionar el release).

### 2. Verificar que compila

```bash
cd frontend
npx tsc -b
```

Debe terminar sin errores. Un error como `TS6133: 'x' is declared but its value is never read` rompe el build del release.

### 3. Commit + push a master

```bash
git add frontend/src-tauri/tauri.conf.json frontend/src-tauri/Cargo.toml frontend/src-tauri/Cargo.lock
git commit -m "vX.Y.Z"
git push origin master   # GitHub
git push azure master    # Azure DevOps
```

### 4. Tag anotado y push a GitHub

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

> **Importante:** el tag debe ir a GitHub (`origin`). El workflow corre solo en GitHub; pushear el tag únicamente a Azure no dispara nada.

### 5. El workflow hace el resto automáticamente

1. Build del backend .NET (`dotnet publish`).
2. `npm run tauri build` → genera `PosWeb_X.Y.Z_x64-setup.exe` + `.sig`.
3. Sube `.exe` y `.nsis.zip` al release de GitHub.
4. Genera `latest.json` (version, url, firma, fecha) y lo pushea a `origin/master`.

### 6. Verificar

- El release de GitHub tiene **assets** (no vacío).
- `latest.json` quedó actualizado a la nueva versión.

## Gotchas

- **Tag solo en Azure** → no dispara el release. Tiene que estar en GitHub.
- **Build falla** (ej. error de TS) → el release queda creado pero **vacío** y `latest.json` no se actualiza. Para reintentar:
  1. `gh release delete vX.Y.Z --yes`
  2. Borrar el tag en **ambos** remotos (el sync azure↔github lo recrea):
     ```bash
     git push azure --delete vX.Y.Z
     git push origin --delete vX.Y.Z
     ```
  3. `git tag -a vX.Y.Z -m "vX.Y.Z"` sobre el commit corregido y `git push origin vX.Y.Z`.
- **Versión desalineada** entre `tauri.conf.json`/`Cargo.*` y el tag → el instalador sale con otro nombre/versión que `latest.json`, rompiendo el auto-updater (loop de "actualización disponible").
- Las keys de firma (`TAURI_PRIVATE_KEY`, `TAURI_PRIVATE_KEY_PASSWORD`) están en los secrets de GitHub.
- Al final del workflow, `origin/master` queda 1 commit adelante de `azure/master` (`chore: update latest.json`); re-sincronizar Azure después (`git pull` + `git push azure master`).
