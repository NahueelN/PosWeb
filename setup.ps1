<#
.SYNOPSIS
  Setup PosWeb project - installs MySQL, creates database, applies migrations, seeds data.
  Run this ONCE after cloning the repo on a new machine.
  Ejecutar: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\setup.ps1
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$MysqlDataDir = Join-Path $ProjectRoot "mysql-data"
$SqlFile = Join-Path $ProjectRoot "seed.sql"

# Ruta personalizada y fija para la herramienta de EF
$CustomToolDir = Join-Path $ProjectRoot ".ef-tool"
$EfExePath = Join-Path $CustomToolDir "dotnet-ef.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     PosWeb - Setup completo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- Preguntar por credenciales de MySQL ---
$usePassword = Read-Host "¿Tu servidor MySQL requiere contraseña para el usuario 'root'? (S/N)"
$mysqlPass = ""
$mysqlArgsCreate = @("-u", "root")
$mysqlArgsSeed = @("-u", "root", "posweb")

if ($usePassword -match "^[sS]") {
    $mysqlPass = Read-Host -AsSecureString "Introduce la contraseña de MySQL root"
    # Convertir SecureString a texto plano para pasarlo de forma segura a los comandos internos
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPass)
    $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    
    # Argumentos dinámicos usando la contraseña
    $mysqlArgsCreate += "-p$plainPass"
    $mysqlArgsSeed += "-p$plainPass"
}

# --- Helper: find MySQL bin folder ---
function Find-MySqlBin {
    $candidates = @(
        Get-ChildItem -Path "C:\Program Files\MySQL" -Directory -ErrorAction SilentlyContinue `
            | Sort-Object Name -Descending `
            | ForEach-Object { Join-Path $_.FullName "bin" }
        Get-ChildItem -Path "C:\Program Files (x86)\MySQL" -Directory -ErrorAction SilentlyContinue `
            | Sort-Object Name -Descending `
            | ForEach-Object { Join-Path $_.FullName "bin" }
    )
    foreach ($c in $candidates) {
        if (Test-Path (Join-Path $c "mysqld.exe")) { return $c }
    }
    $fromPath = (Get-Command "mysqld" -ErrorAction SilentlyContinue).Source
    if ($fromPath) { return (Split-Path $fromPath -Parent) }
    return $null
}

# ====================================================================
# 1. Check / Install MySQL
# ====================================================================
Write-Host "[1/7] Verificando MySQL..." -ForegroundColor Yellow
$MysqlBin = Find-MySqlBin

if (-not $MysqlBin) {
    Write-Host "   MySQL no encontrado. Instalando via winget..." -ForegroundColor Yellow
    winget install --id Oracle.MySQL --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: No se pudo instalar MySQL. Instalalo manualmente:" -ForegroundColor Red
        Write-Host "  winget install Oracle.MySQL" -ForegroundColor White
        exit 1
    }
    Write-Host "   MySQL instalado. Detectando ruta..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    $MysqlBin = Find-MySqlBin
    if (-not $MysqlBin) {
        Write-Host "ERROR: MySQL se instaló pero no se encuentra mysqld.exe." -ForegroundColor Red
        Write-Host "  Buscalo manualmente en C:\Program Files\MySQL\ y volvé a correr setup.ps1" -ForegroundColor Red
        exit 1
    }
}

Write-Host "   MySQL bin: $MysqlBin" -ForegroundColor Green

# ====================================================================
# 2. Initialize MySQL data directory (if needed)
# ====================================================================
Write-Host "[2/7] Verificando data directory..." -ForegroundColor Yellow

$mysqlDataExists = Test-Path (Join-Path $MysqlDataDir "mysql")
$mysqlRunning = (Get-Process -Name "mysqld" -ErrorAction SilentlyContinue).Count -gt 0

if ($mysqlRunning) {
    Write-Host "   MySQL ya está corriendo" -ForegroundColor Green
}

if (-not $mysqlRunning -and -not $mysqlDataExists) {
    Write-Host "   Inicializando data directory en: $MysqlDataDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $MysqlDataDir -Force | Out-Null
    & "$MysqlBin\mysqld" --initialize-insecure --datadir="$MysqlDataDir" --console
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Host "ERROR: No se pudo inicializar MySQL" -ForegroundColor Red
        exit 1
    }
    Write-Host "   Data directory inicializado" -ForegroundColor Green
} elseif (-not $mysqlRunning) {
    Write-Host "   Data directory ya existe" -ForegroundColor Green
}

# ====================================================================
# 3. Start MySQL
# ====================================================================
if (-not $mysqlRunning) {
    Write-Host "[3/7] Arrancando MySQL..." -ForegroundColor Yellow
    $logFile = Join-Path $MysqlDataDir "mysql.log"
    Start-Process -FilePath "$MysqlBin\mysqld" `
        -ArgumentList "--datadir=$MysqlDataDir --port=3306" `
        -WindowStyle Hidden -RedirectStandardOutput $logFile
    Start-Sleep -Seconds 5
    $proc = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
    if (-not $proc) {
        Write-Host "ERROR: MySQL no arrancó. Revisá el log:" -ForegroundColor Red
        Write-Host "  $logFile" -ForegroundColor White
        exit 1
    }
    Write-Host "   MySQL corriendo (PID: $($proc[0].Id))" -ForegroundColor Green
}

# ====================================================================
# 4. Create database
# ====================================================================
Write-Host "[4/7] Creando base de datos posweb..." -ForegroundColor Yellow

$OldErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"

try {
    & "$MysqlBin\mysql" @mysqlArgsCreate -e "CREATE DATABASE IF NOT EXISTS posweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>$null
} catch {}

$ErrorActionPreference = $OldErrorAction

if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host "ERROR: No se pudo crear la base de datos. Verificá tu contraseña." -ForegroundColor Red
    exit 1
}
Write-Host "   Base de datos 'posweb' lista" -ForegroundColor Green

# ====================================================================
# 5. Install dotnet-ef tool (if needed)
# ====================================================================
Write-Host "[5/7] Verificando dotnet-ef tool..." -ForegroundColor Yellow

$OldEFErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"

$efInstalled = $false
try {
    $efCheck = dotnet tool list --global 2>$null | Select-String "dotnet-ef"
    if ($efCheck) {
        $efInstalled = $true
        Write-Host "   dotnet-ef ya instalado globalmente" -ForegroundColor Green
    }
} catch {}

if (-not $efInstalled) {
    # Borramos cualquier residuo de manifiestos locales que esté molestando
    if (Test-Path (Join-Path $ProjectRoot ".config\dotnet-tools.json")) {
        Remove-Item (Join-Path $ProjectRoot ".config\dotnet-tools.json") -Force -ErrorAction SilentlyContinue
    }

    try {
        Write-Host "   Instalando dotnet-ef globalmente..." -ForegroundColor Yellow
        dotnet tool install dotnet-ef --global 2>&1 | Out-Null
        $efInstalled = $true
    } catch {}
}

$ErrorActionPreference = $OldEFErrorAction

if (-not $efInstalled) {
    Write-Host "ERROR: No se pudo instalar dotnet-ef." -ForegroundColor Red
    Write-Host "  Instalalo manualmente: dotnet tool install --global dotnet-ef" -ForegroundColor White
    exit 1
}

Write-Host "   dotnet-ef listo" -ForegroundColor Green

# ====================================================================
# 6. EF Core migrations
# ====================================================================
Write-Host "[6/7] Aplicando migrations EF Core..." -ForegroundColor Yellow
Push-Location (Join-Path $ProjectRoot "PosWeb")

# Si se ingresó contraseña, la inyectamos temporalmente como variable de entorno para EF Core
if ($plainPass) {
    $env:ConnectionStrings__DefaultConnection = "Server=localhost;Database=posweb;Uid=root;Pwd=$plainPass;"
}

# Buscar dotnet-ef (global tools puede no estar en PATH)
$efExe = (Get-Command dotnet-ef -ErrorAction SilentlyContinue).Source
if (-not $efExe) {
    $dotnetToolsDir = Join-Path $env:USERPROFILE ".dotnet\tools"
    $efExe = Join-Path $dotnetToolsDir "dotnet-ef.exe"
}

if (-not (Test-Path $efExe)) {
    Write-Host "ERROR: No se encuentra dotnet-ef.exe" -ForegroundColor Red
    Pop-Location
    exit 1
}

& $efExe database update 2>&1
$efExitCode = $LASTEXITCODE

# Limpiar la variable de entorno por seguridad
if ($plainPass) { $env:ConnectionStrings__DefaultConnection = $null }

if ($efExitCode -ne 0 -and $efExitCode -ne $null) {
    Write-Host "ERROR: Fallaron las migrations" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "   Migrations aplicadas" -ForegroundColor Green

# ====================================================================
# 7. Seed data + npm install
# ====================================================================
Write-Host "[7/7] Insertando datos semilla y preparando frontend..." -ForegroundColor Yellow

# Seed SQL
if (Test-Path $SqlFile) {
    $OldErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    
    try {
        Get-Content $SqlFile | & "$MysqlBin\mysql" @mysqlArgsSeed 2>$null
    } catch {}
    
    $ErrorActionPreference = $OldErrorAction

    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Host "WARNING: Error insertando seed data (puede que ya exista)" -ForegroundColor Yellow
    } else {
        Write-Host "   Datos semilla insertados" -ForegroundColor Green
    }
} else {
    Write-Host "WARNING: No se encuentra seed.sql en $SqlFile" -ForegroundColor Yellow
}

# npm install
if (Test-Path (Join-Path $ProjectRoot "frontend\package.json")) {
    Push-Location (Join-Path $ProjectRoot "frontend")
    npm install 2>&1
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Host "WARNING: npm install tuvo errores. Revisá manualmente." -ForegroundColor Yellow
    } else {
        Write-Host "   Dependencias del frontend instaladas" -ForegroundColor Green
    }
    Pop-Location
}

# ====================================================================
# Done
# ====================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup completado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para levantar el proyecto:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Backend (no cerrar):" -ForegroundColor Cyan
Write-Host "     dotnet run --project PosWeb" -ForegroundColor White
Write-Host ""
Write-Host "  2. Frontend (otra terminal):" -ForegroundColor Cyan
Write-Host "     cd frontend" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  3. Abrir http://localhost:5173" -ForegroundColor Cyan
Write-Host "     Usuario: admin / Contrasena: 123" -ForegroundColor White
Write-Host ""
Write-Host "Para APAGAR MySQL al terminar:" -ForegroundColor Yellow
Write-Host "  .\stop-mysql.ps1" -ForegroundColor White