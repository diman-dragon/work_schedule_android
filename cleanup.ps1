# cleanup.ps1
# Removes old junk exports and one-time scripts that already did their job.
# bump-version.ps1 is intentionally NOT in this list -- it is still needed
# for every future release (bumps the version + updates sw.js cache list).
#
# This file is pure ASCII on purpose (see the encoding lessons learned with
# rebuild-git-history.ps1): the Cyrillic file names below are Base64-decoded
# at runtime instead of being typed directly into this script.
#
# Run from the project root (same folder as index.html):
#   .\cleanup.ps1

function Decode-Utf8Base64([string]$b64) {
    $bytes = [System.Convert]::FromBase64String($b64)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

$files = @(
    (Decode-Utf8Base64 "0LPRgNCw0YTQuNC6Lmh0bWw="),                                  # grafik.html
    (Decode-Utf8Base64 "0LPRgNCw0YTQuNC6LnppcA=="),                                  # grafik.zip
    (Decode-Utf8Base64 "0LPRgNCw0YTQuNC6X9C00LDQvdC90YvQtS5jc3Y="),                  # grafik_dannye.csv
    (Decode-Utf8Base64 "0LPRgNCw0YTQuNC6X9C00LDQvdC90YvQtS5qc29u"),                  # grafik_dannye.json
    (Decode-Utf8Base64 "0KDQsNCx0L7RgtGH0LjQuSDQs9GA0LDRhNC40Log0LzQvtC5Lnhsc3g="),  # Rabotchiy grafik moy.xlsx
    "commit-13.ps1",
    "rebuild-git-history.ps1",
    "rebuild-git-history-12.ps1"
)

foreach ($f in $files) {
    if (Test-Path -LiteralPath $f) {
        Remove-Item -LiteralPath $f -Force
        Write-Host "Removed: $f"
    } else {
        Write-Host "Not found (already gone?): $f"
    }
}

Write-Host ""
Write-Host "Done. Commit the cleanup:" -ForegroundColor Green
Write-Host "  git add -A"
Write-Host "  git commit -m \"cleanup: removed old exports and one-time scripts\""
Write-Host "  git push origin main"
