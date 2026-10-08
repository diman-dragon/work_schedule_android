# Menyaet versiyu prilozheniya srazu vezde (ASCII header for safety,
# actual comments below stay in Russian since regular strings are safe here).
#
# Rules for use of this script are the same as before:
#   .\bump-version.ps1                 -> increments the last number, e.g. 3.0.0 -> 3.0.1
#   .\bump-version.ps1 -Version 3.1.0  -> sets an exact version
#
# Now ALSO updates the Service Worker (sw.js): its CACHE_VERSION and the full
# list of files it caches (PRECACHE_URLS), rebuilt from the current index.html.
# This matters: without updating sw.js too, bumping the version in index.html
# alone would not be enough to make the app fetch fresh files on phones that
# already installed the previous Service Worker.

param([string]$Version)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path 'index.html')) {
    Write-Host "index.html not found. Run this from the project root." -ForegroundColor Red
    exit 1
}

$verFile = 'js/config/app-version.js'
$verText = Get-Content $verFile -Raw -Encoding UTF8
if ($verText -notmatch "APP_VERSION\s*=\s*'([^']+)'") {
    Write-Host "Could not read current version from $verFile" -ForegroundColor Red
    exit 1
}
$current = $Matches[1]

if ([string]::IsNullOrWhiteSpace($Version)) {
    $parts = $current.Split('.')
    $parts[-1] = [int]$parts[-1] + 1
    $Version = $parts -join '.'
}

Write-Host "Version: $current  ->  $Version"

function Write-Utf8NoBom([string]$path, [string]$text) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($path, $text, $utf8NoBom)
}

# 1) js/config/app-version.js
$verText = $verText -replace "APP_VERSION\s*=\s*'[^']+'", "APP_VERSION = '$Version'"
Write-Utf8NoBom (Resolve-Path $verFile) $verText

# 2) all ?v=... in index.html
$html = Get-Content 'index.html' -Raw -Encoding UTF8
$html = $html -replace '\?v=[0-9A-Za-z\.\-]+', "?v=$Version"

# the "VERSIYA PRILOZHENIYA: X.X.X" comment marker inside index.html is written
# in Cyrillic; this script's own source stays pure ASCII (see the encoding
# lessons in rebuild-git-history.ps1), so the Cyrillic label is decoded from
# Base64 at runtime instead of being typed directly into this file.
$verLabel = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("0JLQldCg0KHQmNCvINCf0KDQmNCb0J7QltCV0J3QmNCvOg=="))
$html = $html -replace ([regex]::Escape($verLabel) + ' [0-9A-Za-z\.\-]+'), ($verLabel + ' ' + $Version)
Write-Utf8NoBom (Resolve-Path 'index.html') $html

# 3) rebuild sw.js: CACHE_VERSION + PRECACHE_URLS, from the fresh index.html
$swFile = 'sw.js'
if (Test-Path $swFile) {
    $sw = Get-Content $swFile -Raw -Encoding UTF8
    $sw = $sw -replace "CACHE_VERSION = '[^']+'", "CACHE_VERSION = '$Version'"

    $urls = New-Object System.Collections.Generic.List[string]
    $urls.Add('./')
    $urls.Add('./index.html')

    foreach ($m in [regex]::Matches($html, '<link rel="stylesheet" href="([^"]+)">')) { $urls.Add($m.Groups[1].Value) }
    foreach ($m in [regex]::Matches($html, '<script src="([^"]+)"></script>')) {
        if ($m.Groups[1].Value -notmatch '^https?://') { $urls.Add($m.Groups[1].Value) }
    }
    foreach ($m in [regex]::Matches($html, '<link rel="manifest" href="([^"]+)">')) { $urls.Add($m.Groups[1].Value) }
    foreach ($m in [regex]::Matches($html, '<link rel="apple-touch-icon" href="([^"]+)">')) { $urls.Add($m.Groups[1].Value) }
    foreach ($m in [regex]::Matches($html, '<link rel="icon"[^>]*href="([^"]+)"')) {
        if ($m.Groups[1].Value -notmatch '^data:') { $urls.Add($m.Groups[1].Value) }
    }

    foreach ($vendorFile in @('js/vendor/chart.umd.min.js', 'js/vendor/chartjs-plugin-datalabels.min.js', 'js/vendor/confetti.browser.min.js')) {
        $urls.Add("$vendorFile?v=$Version")
    }
    if (Test-Path 'icons') {
        Get-ChildItem 'icons' -Filter '*.png' | ForEach-Object { $urls.Add('icons/' + $_.Name) }
    }

    $seen = New-Object System.Collections.Generic.HashSet[string]
    $uniqueUrls = @()
    foreach ($u in $urls) { if ($seen.Add($u)) { $uniqueUrls += $u } }

    $jsArray = ($uniqueUrls | ForEach-Object { '  "' + $_ + '"' }) -join ",`n"
    $newBlock = "const PRECACHE_URLS = [`n$jsArray`n];"
    $sw = [regex]::Replace($sw, 'const PRECACHE_URLS = \[.*?\];', { param($m) $newBlock }, [System.Text.RegularExpressions.RegexOptions]::Singleline)

    Write-Utf8NoBom (Resolve-Path $swFile) $sw
    Write-Host "sw.js updated: cache version + $($uniqueUrls.Count) precached files" -ForegroundColor Green
} else {
    Write-Host "sw.js not found, skipped (no Service Worker in this project)" -ForegroundColor Yellow
}

Write-Host "Done. Updated index.html, $verFile, sw.js" -ForegroundColor Green
Write-Host "Now upload the files to your hosting."
