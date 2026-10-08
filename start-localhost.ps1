# Запускает приложение на http://localhost:8000 и открывает его в браузере.
#
# Зачем это нужно: при открытии index.html двойным кликом адрес выглядит как
# file:///C:/... — в таком режиме Google OAuth и Service Worker (офлайн-кеш)
# не работают. Google требует http/https-адрес, а браузеры ограничивают
# Service Worker теми же схемами. Через localhost всё работает как на
# настоящем сайте.
#
# Запуск: правой кнопкой по файлу -> "Выполнить с помощью PowerShell",
# либо в консоли из корня проекта:  .\start-localhost.ps1
#
# Остановить сервер: Ctrl+C в открывшемся окне.

param([int]$Port = 8000)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path 'index.html')) {
    Write-Host "index.html not found. Run this from the project root." -ForegroundColor Red
    exit 1
}

$url = "http://localhost:$Port"

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { $python = Get-Command py -ErrorAction SilentlyContinue }
$node = Get-Command npx -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "  App address: $url" -ForegroundColor Cyan
Write-Host "  Stop server: Ctrl+C" -ForegroundColor DarkGray
Write-Host ""

Start-Job -ScriptBlock { Start-Sleep -Seconds 2; Start-Process $using:url } | Out-Null

if ($python) {
    & $python.Source -m http.server $Port
}
elseif ($node) {
    & npx --yes http-server -p $Port -c-1 .
}
else {
    Write-Host "Neither Python nor Node.js found." -ForegroundColor Red
    Write-Host "Install Python from https://www.python.org/downloads/ (check 'Add to PATH')," -ForegroundColor Yellow
    Write-Host "then run this script again." -ForegroundColor Yellow
    exit 1
}
