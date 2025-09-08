param(
  [switch]$Seed = $false,
  [int]$BackendPort = 8000,
  [int]$FrontendPort = 5173,
  [switch]$Reinstall = $false
)

$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'

Write-Host "== Supermercado: setup local dev (Django + Vite) ==" -ForegroundColor Cyan

# --- Backend: venv + deps + migrate (+seed) ---
if (!(Test-Path (Join-Path $backendDir '.venv'))) {
  Write-Host "[backend] Creando venv..." -ForegroundColor Yellow
  Push-Location $backendDir
  python -m venv .venv
  Pop-Location
}

$venvPy = Join-Path $backendDir '.venv\Scripts\python.exe'
$venvPip = Join-Path $backendDir '.venv\Scripts\pip.exe'

Write-Host "[backend] Instalando dependencias..." -ForegroundColor Yellow
Push-Location $backendDir
& $venvPip install --upgrade pip | Out-Host
& $venvPip install -r requirements.txt | Out-Host

Write-Host "[backend] Migraciones..." -ForegroundColor Yellow
& $venvPy manage.py migrate --noinput | Out-Host

if ($Seed) {
  Write-Host "[backend] Seed de datos (admin + productos)..." -ForegroundColor Yellow
  & $venvPy -c "import os,django; os.environ.setdefault('DJANGO_SETTINGS_MODULE','supermercado.settings'); django.setup(); import seed; seed.run()" | Out-Host
}
Pop-Location

# --- Frontend: ensure .env.local ---
$envFile = Join-Path $frontendDir '.env.local'
$apiUrl = "VITE_API_URL=http://localhost:$BackendPort/api"
if (!(Test-Path $envFile)) {
  Write-Host "[frontend] Creando .env.local..." -ForegroundColor Yellow
  Set-Content -Path $envFile -Value $apiUrl -Encoding UTF8
} else {
  $content = Get-Content -Raw $envFile
  if ($content -notmatch 'VITE_API_URL=') {
    Add-Content -Path $envFile -Value $apiUrl
  } else {
    $newContent = $content -replace "^VITE_API_URL=.*$", $apiUrl
    if ($newContent -ne $content) {
      Set-Content -Path $envFile -Value $newContent -Encoding UTF8
    }
  }
}

# --- Start backend (background job) ---
Write-Host "[backend] Iniciando Django en http://localhost:$BackendPort ..." -ForegroundColor Green
$backendJob = Start-Job -Name 'django' -ScriptBlock {
  param($py, $dir, $port)
  Set-Location $dir
  & $py manage.py runserver 0.0.0.0:$port
} -ArgumentList $venvPy, $backendDir, $BackendPort

Start-Sleep -Seconds 1
if ((Get-Job -Id $backendJob.Id).State -eq 'Failed') {
  Write-Error "No se pudo iniciar el backend. Verifica el log del job 'django'."
  Receive-Job -Id $backendJob.Id | Out-Host
  throw "Backend failed to start"
}

# --- Frontend: deps + dev server (foreground) ---
Push-Location $frontendDir
if ($Reinstall -or -not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
  Write-Host "[frontend] Instalando dependencias (npm install)..." -ForegroundColor Yellow
  npm install | Out-Host
}

try {
  Write-Host "[frontend] Abriendo Vite en http://localhost:$FrontendPort ... (Ctrl+C para salir)" -ForegroundColor Green
  # Usar npx directamente para pasar flags correctamente en PowerShell
  npx vite --port $FrontendPort --host
} finally {
  Write-Host "[backend] Deteniendo Django..." -ForegroundColor Yellow
  if (Get-Job -Id $backendJob.Id -ErrorAction SilentlyContinue) {
    Stop-Job -Id $backendJob.Id -Force
    Remove-Job -Id $backendJob.Id -Force
  }
  Pop-Location
}
