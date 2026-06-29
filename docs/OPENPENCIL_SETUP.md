# OpenPencil MCP — Setup y Mantenimiento

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   OpenCode TUI                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Cliente MCP (StreamableHTTP)                │   │
│  │  → http://127.0.0.1:7600/mcp                 │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────┘
                       │ POST /mcp (JSON-RPC)
                       ▼
┌─────────────────────────────────────────────────────┐
│           Servidor MCP (Node.js)                     │
│  PID: node                                           │
│  Puerto HTTP: 7600  ←  Recibe llamadas MCP           │
│  Puerto WS:   7601  ←  Conexión con Desktop App      │
│  authRequired: false  (sin token de autenticación)   │
└──────────────────────┬──────────────────────────────┘
                       │ WebSocket (register + RPC)
                       ▼
┌─────────────────────────────────────────────────────┐
│              OpenPencil Desktop App                  │
│  PID: OpenPencil                                     │
│  Se conecta a ws://127.0.0.1:7601                    │
│  Envía token de registro (browserToken)              │
└─────────────────────────────────────────────────────┘
```

## Puertos

| Puerto | Protocolo | Uso                        |
| ------ | --------- | -------------------------- |
| 7600   | HTTP      | API MCP (StreamableHTTP)   |
| 7601   | WebSocket | Comunicación con Desktop   |

## Orden de inicio correcto

**Siempre** en este orden:

1. **Servidor MCP** (node)
2. **OpenPencil Desktop** (app de escritorio)
3. Esperar a que OpenCode reconecte automáticamente

Si OpenPencil Desktop arranca primero, puede iniciar su propio servidor MCP con autenticación habilitada, lo que rompe la conexión con OpenCode.

## Cómo iniciar el servidor MCP correctamente

### Requisito crítico

La variable de entorno `OPENPENCIL_MCP_AUTH_TOKEN` **NO** debe estar definida. Si OpenPencil Desktop la estableció, el servidor arrancará con `authRequired: true` y OpenCode no podrá conectarse.

### Comando

```powershell
# Desde PowerShell, en cualquier directorio:
$mcpModule = "C:\Users\nahuel\scoop\apps\nodejs\current\bin\node_modules\@open-pencil\mcp\dist\index.mjs"
Start-Process -FilePath "node" -ArgumentList @("`"$mcpModule`"") -NoNewWindow -RedirectStandardError "$env:TEMP\mcp-server.txt"
```

### Verificación rápida

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:7600/health" -Method GET

# Debe responder con algo como:
# {
#   "status": "ok",
#   "version": "0.13.2",
#   "installCommand": "npm i -g @open-pencil/mcp@0.13.2",
#   "authRequired": false,
#   "token": "4dd82ae6..."
# }
```

**Campos importantes:**
- `authRequired: false` → el servidor NO pide token de autenticación ✓
- `status: "ok"` → la app desktop está conectada vía WebSocket ✓
- `status: "no_app"` → la app desktop NO está conectada (funciona igual, pero las tools que requieren el canvas fallarán)

## Cómo iniciar OpenPencil Desktop

Simplemente abrir la aplicación OpenPencil desde el menú de inicio o acceso directo.

Se conecta automáticamente a `ws://127.0.0.1:7601` si el servidor MCP ya está corriendo.

## Procesos que deben existir

| Proceso       | PID (ejemplo) | Qué es                            |
| ------------- | ------------- | --------------------------------- |
| `node`        | 21096         | Servidor MCP de OpenPencil        |
| `OpenPencil`  | 18708         | App de escritorio OpenPencil      |

## Cómo verificar que todo funciona

### 1. Puertos abiertos

```powershell
netstat -ano | Where-Object { $_ -match "127.0.0.1:7600|127.0.0.1:7601" }
```

Debe mostrar ambos puertos en estado `LISTENING`.

### 2. Inicialización MCP completa

```powershell
# Inicializar sesión MCP
$initPayload = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
Set-Content -Path "$env:TEMP\mcp-init.json" -Value $initPayload
curl.exe -s -X POST "http://localhost:7600/mcp" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "@$env:TEMP\mcp-init.json"
```

Respuesta esperada:
```
event: message data: {"result":{"protocolVersion":"2025-03-26","capabilities":{...}},...}
```

### 3. Listar herramientas disponibles

```powershell
# Obtener session-id de la respuesta anterior y usarla:
# Primero obtener headers:
curl.exe -s -D "$env:TEMP\mcp-headers.txt" -X POST "http://localhost:7600/mcp" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "@$env:TEMP\mcp-init.json"
# Extraer session-id manualmente del archivo, luego:
$toolsPayload = '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
Set-Content -Path "$env:TEMP\mcp-tools.json" -Value $toolsPayload
curl.exe -s -X POST "http://localhost:7600/mcp" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -H "mcp-session-id: <session-id-aqui>" -d "@$env:TEMP\mcp-tools.json"
```

### 4. Probar una herramienta simple desde OpenCode

Usar cualquiera de las tools de OpenPencil disponibles en el autocompletado, por ejemplo `openpencil_get_current_page`.

## Cómo detectar si volvió el problema de autenticación

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:7600/health" -Method GET
```

**Síntoma de problema:** `authRequired: true`

Si aparece `authRequired: true`, significa que el servidor se inició con `OPENPENCIL_MCP_AUTH_TOKEN` en el entorno. Generalmente causado por:

- OpenPencil Desktop inició el servidor automáticamente antes de que lo iniciáramos nosotros
- Alguien ejecutó `openpencil-mcp-http` desde un contexto que tenía la variable
- La app desktop se reinició y levantó su propio servidor

## Cómo reiniciar el entorno correctamente sin romper la conexión

### Si las tools dejan de funcionar (reconexión de OpenCode)

```powershell
# 1. Matar el servidor actual
$pidMCP = (netstat -ano | Where-Object { $_ -match "127.0.0.1:7600.*LISTENING" }).Trim().Split()[-1]
Stop-Process -Id $pidMCP -Force

# 2. Esperar 10 segundos para que OpenCode detecte la desconexión
Start-Sleep -Seconds 10

# 3. Iniciar servidor fresco
$mcpModule = "C:\Users\nahuel\scoop\apps\nodejs\current\bin\node_modules\@open-pencil\mcp\dist\index.mjs"
Start-Process -FilePath "node" -ArgumentList @("`"$mcpModule`"") -NoNewWindow -RedirectStandardError "$env:TEMP\mcp-server.txt"

# 4. Esperar a que OpenCode reconecte (unos segundos)
Start-Sleep -Seconds 5
```

### Si el servidor se llena de sesiones MCP (error "Too many active MCP sessions")

```powershell
# El servidor tiene un máximo de 10 sesiones concurrentes.
# Matar y reiniciar es la solución.
Stop-Process -Id $pidMCP -Force
# Seguir los pasos 2-4 de arriba
```

### Pasos para reinicio completo (servidor + OpenCode TUI)

Si nada de lo anterior funciona:

1. Cerrar OpenCode TUI (Ctrl+C)
2. Ejecutar el script de reinicio del servidor MCP
3. Reabrir OpenCode TUI

## Configuración en OpenCode

Archivo: `C:\Users\nahuel\.config\opencode\opencode.jsonc`

```jsonc
"openpencil": {
    "url": "http://127.0.0.1:7600/mcp",
    "oauth": false       // Desactiva detección automática de OAuth
}
```

**Importante:** `"oauth": false` es necesario porque sin esto, OpenCode intenta hacer un handshake OAuth al recibir el 401, lo que genera el error "Invalid OAuth error response".

## Anatomía del error "Server not initialized"

Este error ocurre cuando el cliente MCP de OpenCode mantiene una sesión que el servidor ya no reconoce (porque el servidor se reinició).

**Solución:** Matar el servidor, esperar 10 segundos a que OpenCode detecte la caída de conexión, y reiniciar el servidor. OpenCode rehará el handshake `initialize` automáticamente.

## Comandos útiles para diagnóstico

```powershell
# Ver salud del servidor
Invoke-RestMethod -Uri "http://localhost:7600/health" -Method GET | ConvertTo-Json

# Ver qué procesos están escuchando en los puertos
netstat -ano | Where-Object { $_ -match "127.0.0.1:7600|127.0.0.1:7601" }

# Ver todos los procesos node
Get-Process -Name "node" | Select-Object Id, StartTime

# Verificar que la variable de entorno NO está definida
$env:OPENPENCIL_MCP_AUTH_TOKEN
# (debe devolver vacío o $null)

# Listar estado de servidores MCP desde OpenCode
opencode mcp list
```

## Troubleshooting rápido

| Síntoma                                   | Causa probable                           | Solución                                      |
| ----------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| `authRequired: true` en health            | Servidor iniciado con token              | Matar y reiniciar desde shell limpia          |
| `Server not initialized`                  | Sesión MCP de OpenCode está stale        | Matar servidor, esperar 10s, reiniciar        |
| `Too many active MCP sessions`            | Se excedieron 10 sesiones                | Matar y reiniciar servidor                    |
| `Invalid OAuth error response`            | `oauth: false` no está en la config      | Agregar `"oauth": false` en opencode.jsonc    |
| `status: "no_app"` en health              | Desktop app desconectada                 | Abrir OpenPencil Desktop                      |
| Tools no aparecen en autocompletado       | Conexión MCP no inicializada             | Verificar `opencode mcp list`                 |
