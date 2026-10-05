param(
    [string]$Configuration = "Release"
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BinariesDir = Join-Path $ProjectRoot "frontend\src-tauri\binaries"
$TargetTriple = "x86_64-pc-windows-msvc"
$SourceExe = Join-Path $BinariesDir "vendeto-mobile.exe"
$TargetExe = Join-Path $BinariesDir "vendeto-mobile-$TargetTriple.exe"
$WorkDir = Join-Path $PSScriptRoot "build"

New-Item -ItemType Directory -Path $BinariesDir -Force | Out-Null

python -m PyInstaller --noconfirm --clean --onefile `
    --name vendeto-mobile `
    --add-data "$PSScriptRoot\static;static" `
    --distpath $BinariesDir `
    --workpath $WorkDir `
    --specpath $PSScriptRoot `
    (Join-Path $PSScriptRoot "server.py")

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Move-Item -Path $SourceExe -Destination $TargetExe -Force
Remove-Item -Path $WorkDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path (Join-Path $PSScriptRoot "vendeto-mobile.spec") -Force -ErrorAction SilentlyContinue

Write-Host "OK: Vendeto Mobile sidecar -> $TargetExe" -ForegroundColor Green
