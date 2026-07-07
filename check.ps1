# MarineOS local verification script (Windows PowerShell)
#
# Runs the same checks as CI: backend tests, frontend type-check, frontend build.
# Usage:   powershell -ExecutionPolicy Bypass -File .\check.ps1
#
# Requires Python 3.11 (see backend\.python-version) and Node.js installed.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$failed = @()

Write-Host "==> MarineOS verification" -ForegroundColor Cyan

# --- Backend: pytest -------------------------------------------------------
Write-Host "`n[1/3] Backend tests (pytest)" -ForegroundColor Yellow
Push-Location "$root\backend"
try {
    if (-not (Test-Path ".\venv\Scripts\Activate.ps1")) {
        Write-Host "  No venv found. Create it first:" -ForegroundColor Red
        Write-Host "    py -3.11 -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt"
        $failed += "backend (no venv)"
    } else {
        & ".\venv\Scripts\Activate.ps1"
        # SECRET_KEY is required by config; tests use SQLite, not the prod DB.
        if (-not $env:SECRET_KEY)   { $env:SECRET_KEY   = "local-test-secret-key" }
        if (-not $env:CLAUDE_API_KEY) { $env:CLAUDE_API_KEY = "sk-local-test" }
        python -m pytest tests -q
        if ($LASTEXITCODE -ne 0) { $failed += "backend tests" }
    }
} finally {
    Pop-Location
}

# --- Frontend: type-check --------------------------------------------------
Write-Host "`n[2/3] Frontend type-check (tsc --noEmit)" -ForegroundColor Yellow
Push-Location "$root\frontend"
try {
    if (-not (Test-Path ".\node_modules")) {
        Write-Host "  Installing frontend dependencies (npm install)..."
        npm install
    }
    npm run type-check
    if ($LASTEXITCODE -ne 0) { $failed += "frontend type-check" }

    # --- Frontend: build ---------------------------------------------------
    Write-Host "`n[3/3] Frontend build (npm run build)" -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { $failed += "frontend build" }
} finally {
    Pop-Location
}

# --- Summary ---------------------------------------------------------------
Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "All checks passed." -ForegroundColor Green
    exit 0
} else {
    Write-Host ("FAILED: " + ($failed -join ", ")) -ForegroundColor Red
    exit 1
}
