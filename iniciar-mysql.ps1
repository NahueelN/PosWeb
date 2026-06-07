<#
.SYNOPSIS
  Start MySQL with the project's data directory.
  Use this after rebooting your machine - setup.ps1 only needs to run once.
#>

$ProjectRoot = $PSScriptRoot
$MysqlDataDir = Join-Path $ProjectRoot "mysql-data"

# Find MySQL installation
$MysqlBin = $null
$candidates = @(
    Get-ChildItem -Path "C:\Program Files\MySQL" -Directory -ErrorAction SilentlyContinue `
        | Sort-Object Name -Descending `
        | ForEach-Object { Join-Path $_.FullName "bin" }
    Get-ChildItem -Path "C:\Program Files (x86)\MySQL" -Directory -ErrorAction SilentlyContinue `
        | Sort-Object Name -Descending `
        | ForEach-Object { Join-Path $_.FullName "bin" }
)
foreach ($c in $candidates) {
    if (Test-Path (Join-Path $c "mysqld.exe")) { $MysqlBin = $c; break }
}
if (-not $MysqlBin) {
    Write-Host "ERROR: No se encuentra MySQL instalado. Corré setup.ps1 primero." -ForegroundColor Red
    exit 1
}

# Check if already running
$proc = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "MySQL ya está corriendo (PID: $($proc[0].Id))" -ForegroundColor Green
    exit 0
}

# Check data directory
if (-not (Test-Path (Join-Path $MysqlDataDir "mysql"))) {
    Write-Host "ERROR: Data directory no inicializado. Corré setup.ps1 primero." -ForegroundColor Red
    exit 1
}

# Start MySQL
Write-Host "Arrancando MySQL..." -ForegroundColor Yellow
$logFile = Join-Path $MysqlDataDir "mysql.log"
Start-Process -FilePath "$MysqlBin\mysqld" `
    -ArgumentList "--datadir=$MysqlDataDir --port=3306" `
    -WindowStyle Hidden -RedirectStandardOutput $logFile

Start-Sleep -Seconds 4

$proc = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "MySQL corriendo (PID: $($proc[0].Id))" -ForegroundColor Green
} else {
    Write-Host "ERROR: MySQL no arrancó. Revisá: $logFile" -ForegroundColor Red
    exit 1
}
