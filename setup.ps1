<#
.SYNOPSIS
  Setup PosWeb project — installs MySQL, creates database, applies migrations, seeds data.
  Run this ONCE after cloning the repo on a new machine.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$MysqlDataDir = Join-Path $ProjectRoot "mysql-data"
$SqlFile = Join-Path $ProjectRoot "seed.sql"
$MysqlBin = "C:\Program Files\MySQL\MySQL Server 8.4\bin"

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     PosWeb — Setup completo              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── 1. Check/Install MySQL ─────────────────────────────────────────
Write-Host "🔍 Paso 1: Verificando MySQL..." -ForegroundColor Yellow
$mysqlInstalled = Test-Path "$MysqlBin\mysqld.exe"

if (-not $mysqlInstalled) {
    Write-Host "   MySQL no encontrado. Instalando via winget..." -ForegroundColor Yellow
    winget install --id Oracle.MySQL --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✖ Error instalando MySQL. Instalalo manualmente: winget install Oracle.MySQL" -ForegroundColor Red
        exit 1
    }
    Write-Host "✔ MySQL instalado correctamente" -ForegroundColor Green
} else {
    Write-Host "✔ MySQL ya está instalado" -ForegroundColor Green
}

# ─── 2. Initialize MySQL data directory ──────────────────────────────
Write-Host ""
Write-Host "🔍 Paso 2: Inicializando data directory..." -ForegroundColor Yellow

# Check if MySQL is already initialized (look for mysql dir with data)
$mysqlDataExists = Test-Path (Join-Path $MysqlDataDir "mysql")
$mysqlRunning = $false

# Check if mysqld is already running
$proc = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($proc) {
    $mysqlRunning = $true
    Write-Host "✔ MySQL ya está corriendo (PID: $($proc.Id))" -ForegroundColor Green
}

if (-not $mysqlRunning -and -not $mysqlDataExists) {
    Write-Host "   Inicializando data directory en: $MysqlDataDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $MysqlDataDir -Force | Out-Null
    & "$MysqlBin\mysqld" --initialize-insecure --datadir="$MysqlDataDir" --console
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Host "✖ Error inicializando MySQL" -ForegroundColor Red
        exit 1
    }
    Write-Host "✔ Data directory inicializado" -ForegroundColor Green
} elseif (-not $mysqlRunning) {
    Write-Host "✔ Data directory ya existe" -ForegroundColor Green
}

# ─── 3. Start MySQL ─────────────────────────────────────────────────
if (-not $mysqlRunning) {
    Write-Host ""
    Write-Host "🔍 Paso 3: Arrancando MySQL..." -ForegroundColor Yellow
    $logFile = Join-Path $MysqlDataDir "mysql.log"
    Start-Process -FilePath "$MysqlBin\mysqld" -ArgumentList "--datadir=$MysqlDataDir --port=3306" -WindowStyle Hidden -RedirectStandardOutput $logFile
    Start-Sleep -Seconds 4
    $proc = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
    if (-not $proc) {
        Write-Host "✖ Error arrancando MySQL. Revisá: $logFile" -ForegroundColor Red
        exit 1
    }
    Write-Host "✔ MySQL corriendo (PID: $($proc[0].Id))" -ForegroundColor Green
}

# ─── 4. Create database ─────────────────────────────────────────────
Write-Host ""
Write-Host "🔍 Paso 4: Creando base de datos posweb..." -ForegroundColor Yellow
& "$MysqlBin\mysql" -u root -e "CREATE DATABASE IF NOT EXISTS posweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✖ Error creando la base de datos" -ForegroundColor Red
    exit 1
}
Write-Host "✔ Base de datos 'posweb' creada" -ForegroundColor Green

# ─── 5. EF Core Migration ──────────────────────────────────────────
Write-Host ""
Write-Host "🔍 Paso 5: Aplicando migrations EF Core..." -ForegroundColor Yellow
Push-Location (Join-Path $ProjectRoot "PosWeb")
dotnet ef database update 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✖ Error aplicando migrations" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "✔ Migrations aplicadas correctamente" -ForegroundColor Green

# ─── 6. Seed data ──────────────────────────────────────────────────
Write-Host ""
Write-Host "🔍 Paso 6: Insertando datos semilla..." -ForegroundColor Yellow
if (Test-Path $SqlFile) {
    & "$MysqlBin\mysql" -u root posweb < $SqlFile 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✖ Error insertando seed data" -ForegroundColor Red
        exit 1
    }
    Write-Host "✔ Datos semilla insertados" -ForegroundColor Green
} else {
    Write-Host "✖ No se encuentra seed.sql en $SqlFile" -ForegroundColor Red
    exit 1
}

# ─── 7. npm install ─────────────────────────────────────────────────
Write-Host ""
Write-Host "🔍 Paso 7: Instalando dependencias del frontend..." -ForegroundColor Yellow
if (Test-Path (Join-Path $ProjectRoot "frontend\package.json")) {
    Push-Location (Join-Path $ProjectRoot "frontend")
    npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ npm install tuvo errores, revisá manualmente" -ForegroundColor Yellow
    } else {
        Write-Host "✔ Dependencias del frontend instaladas" -ForegroundColor Green
    }
    Pop-Location
} else {
    Write-Host "⚠ No se encontró frontend/package.json" -ForegroundColor Yellow
}

# ─── Done ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅  Setup completado                      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Para levantar el proyecto:"
Write-Host "  1. Backend (no cerrar):" -ForegroundColor Cyan
Write-Host "     cd PosWeb" -ForegroundColor White
Write-Host "     dotnet run" -ForegroundColor White
Write-Host ""
Write-Host "  2. Frontend (otra terminal):" -ForegroundColor Cyan
Write-Host "     cd frontend" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  3. Abrir http://localhost:5173" -ForegroundColor Cyan
Write-Host "     Usuario: admin / Contraseña: 123" -ForegroundColor White
Write-Host ""
Write-Host "⚠ Para APAGAR MySQL al terminar:" -ForegroundColor Yellow
Write-Host "  C:\Dev\Pos\stop-mysql.ps1" -ForegroundColor White
