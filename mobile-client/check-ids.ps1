param(
    [string]$Path = (Join-Path $PSScriptRoot "static\index.html")
)

# Detecta referencias $('id') sin un id="" correspondiente. Un id huérfano
# lanza un TypeError al inicializar y desactiva todos los enlaces posteriores.
#
# Tambien valida los iconos: cada <span class="msi i-NOMBRE"> necesita su regla
# CSS .i-NOMBRE::before. El subset local de Material Symbols NO incluye la feature
# GSUB/liga, por eso los iconos van por codepoint PUA y nunca por ligature.

$html = Get-Content $Path -Raw
$referenced = [regex]::Matches($html, "\`$\('([a-zA-Z]+)'\)") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$defined = [regex]::Matches($html, 'id="([a-zA-Z]+)"') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$missing = $referenced | Where-Object { $_ -notin $defined }

if ($missing) {
    Write-Host "FALTAN ids: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host "OK: $($referenced.Count) ids referenciados y $($defined.Count) definidos" -ForegroundColor Green

$iconsUsed = [regex]::Matches($html, 'class="msi i-([a-z0-9-]+)"') |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$iconsDefined = [regex]::Matches($html, '\.i-([a-z0-9-]+)::before') |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$iconsUnused = $iconsDefined | Where-Object { $_ -notin $iconsUsed }

$iconsMissing = $iconsUsed | Where-Object { $_ -notin $iconsDefined }
if ($iconsMissing) {
    Write-Host "FALTAN reglas de icono: $($iconsMissing -join ', ')" -ForegroundColor Red
    exit 1
}

$legacyLigature = [regex]::Matches($html, 'class="msi">\s*[a-z0-9_]+<')
if ($legacyLigature.Count -gt 0) {
    Write-Host "ICONOS POR LIGATURE (se verian como texto): $($legacyLigature.Count)" -ForegroundColor Red
    exit 1
}

if ($iconsUnused) {
    Write-Host "AVISO: reglas de icono sin usar: $($iconsUnused -join ', ')" -ForegroundColor Yellow
}

Write-Host "OK: $($iconsUsed.Count) iconos por codepoint, todos con regla CSS" -ForegroundColor Green
