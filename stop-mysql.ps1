<#
.SYNOPSIS
  Detiene MySQL si lo arrancó setup.ps1
#>

Write-Host "Deteniendo MySQL..." -ForegroundColor Yellow
$proc = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($proc) {
    $proc | Stop-Process -Force
    Write-Host "✔ MySQL detenido" -ForegroundColor Green
} else {
    Write-Host "⚠ MySQL no estaba corriendo" -ForegroundColor Yellow
}
