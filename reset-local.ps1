<#
.SYNOPSIS
  Borra todos los datos de la base SQLite local (posweb.db) para arrancar de 0.
  Elimina posweb.db junto con sus archivos WAL/SHM. El próximo "dotnet run"
  la recrea automáticamente aplicando migraciones + seed.

.PARAMETER Force
  No pide confirmación y no chequea si la app está corriendo.

.EXAMPLE
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\reset-local.ps1
#>

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$DbDir = Join-Path $ProjectRoot "PosWeb"
$DbName = "posweb.db"

# SQLite en modo WAL crea archivos auxiliares -wal y -shm que hay que borrar también
$DbFiles = @(
    (Join-Path $DbDir $DbName),
    (Join-Path $DbDir "$DbName-shm"),
    (Join-Path $DbDir "$DbName-wal")
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PosWeb - Reset base local (SQLite)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Si la app está corriendo puede tener la DB tomada; conviene cerrarla primero
$running = Get-Process -Name "PosWeb" -ErrorAction SilentlyContinue
if ($running -and -not $Force) {
    Write-Host "PosWeb parece estar corriendo (PID: $($running[0].Id))." -ForegroundColor Yellow
    Write-Host "Cerrá la app antes de resetear, o volvé a correr con -Force." -ForegroundColor Yellow
    exit 1
}

$existentes = @($DbFiles | Where-Object { Test-Path -LiteralPath $_ })
if ($existentes.Count -eq 0) {
    Write-Host "No hay base local para borrar ($DbDir\$DbName)." -ForegroundColor Green
    Write-Host "Ya está limpio: levantá con 'dotnet run --project PosWeb'." -ForegroundColor Gray
    exit 0
}

if (-not $Force) {
    Write-Host "Se van a borrar:" -ForegroundColor Yellow
    $existentes | ForEach-Object { Write-Host "  $_" }
    Write-Host ""
    $resp = Read-Host "¿Confirmás? (S/N)"
    if ($resp -notmatch "^[sS]") {
        Write-Host "Cancelado. No se borró nada." -ForegroundColor Yellow
        exit 0
    }
}

foreach ($file in $DbFiles) {
    if (Test-Path -LiteralPath $file) {
        Remove-Item -LiteralPath $file -Force
        Write-Host "Borrado: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Base local reseteada. Ahora levantá:" -ForegroundColor Cyan
Write-Host "  dotnet run --project PosWeb" -ForegroundColor White
Write-Host 'Se recrea desde 0. Para desarrollo, definí Seed__AdminPassword o usá Seed__ResetAdminPassword.' -ForegroundColor Gray
