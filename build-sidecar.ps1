param(
    [string]$Configuration = "Release"
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendProject = Join-Path $ProjectRoot "PosWeb\PosWeb.csproj"
$BinariesDir = Join-Path $ProjectRoot "frontend\src-tauri\binaries"

Write-Host "=== Building .NET backend sidecar ===" -ForegroundColor Cyan

# Create binaries directory if it doesn't exist
New-Item -ItemType Directory -Path $BinariesDir -Force | Out-Null

# Publish self-contained .NET app
dotnet publish $BackendProject `
    -r win-x64 `
    --self-contained true `
    -c $Configuration `
    -o "$BinariesDir\publish"

if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: dotnet publish exited with code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

# Rename the binary with Tauri's target-triple naming convention
$targetTriple = "x86_64-pc-windows-msvc"
$sourceExe = Join-Path $BinariesDir "publish\PosWeb.exe"
$targetExe = Join-Path $BinariesDir "posweb-backend-$targetTriple.exe"

if (Test-Path $sourceExe) {
    Move-Item -Path $sourceExe -Destination $targetExe -Force
    Write-Host "OK: Sidecar binary -> $targetExe" -ForegroundColor Green
} else {
    Write-Host "ERROR: Published exe not found at $sourceExe" -ForegroundColor Red
    exit 1
}

# Clean up publish temp directory
Remove-Item -Path "$BinariesDir\publish" -Recurse -Force -ErrorAction SilentlyContinue

# Show size
$size = (Get-Item $targetExe).Length / 1MB
Write-Host "Sidecar size: $([math]::Round($size, 1)) MB" -ForegroundColor Gray

Write-Host "=== Sidecar build complete ===" -ForegroundColor Cyan
