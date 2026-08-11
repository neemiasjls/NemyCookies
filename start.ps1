# =============================================================
#  NemyCookies - ambiente local (frontend + Supabase na nuvem)
#
#  O banco e a API agora rodam no Supabase, entao aqui so sobe o site.
#  Uso:   .\start.ps1      Logs: .\logs\frontend.log      Parar: .\stop.ps1
# =============================================================

$Root = $PSScriptRoot
$Logs = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $Logs | Out-Null

$SiteUrl   = 'http://localhost:5173'
$PortFront = 5173

function Test-PortListening {
    param([int]$Port)
    return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Wait-HttpOk {
    param([string]$Url, [int]$TimeoutSec)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            if ((Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Seconds 2
    }
    return $false
}

Write-Host ''
Write-Host ' ============================================='
Write-Host '  NemyCookies - Iniciando o site'
Write-Host ' ============================================='
Write-Host ''

# Precisa das variaveis do Supabase
$envFile = Join-Path $Root 'frontend\.env'
if (-not (Test-Path $envFile)) {
    Write-Host '  AVISO: frontend\.env nao encontrado.' -ForegroundColor Yellow
    Write-Host '  Copie frontend\.env.example para frontend\.env e preencha as chaves do Supabase.' -ForegroundColor Yellow
    exit 1
}

if (Test-PortListening -Port $PortFront) {
    Write-Host '  Site ja esta rodando na porta 5173 - pulando.' -ForegroundColor Green
} else {
    $frontLog = Join-Path $Logs 'frontend.log'
    Start-Process -FilePath 'cmd.exe' `
        -ArgumentList '/c', ('npm run dev > "{0}" 2>&1' -f $frontLog) `
        -WorkingDirectory (Join-Path $Root 'frontend') `
        -WindowStyle Hidden
    Write-Host '  Iniciando em segundo plano (log: logs\frontend.log)...'
}

Write-Host ''
Write-Host 'Aguardando o site responder...'
if (-not (Wait-HttpOk -Url $SiteUrl -TimeoutSec 90)) {
    Write-Host '  AVISO: site nao respondeu em 90s. Veja logs\frontend.log' -ForegroundColor Yellow
    exit 1
}
Write-Host '  Site OK (HTTP 200)' -ForegroundColor Green

Write-Host ''
Write-Host ' ============================================='
Write-Host ('  Site:  {0}' -f $SiteUrl)
Write-Host ('  Admin: {0}/admin' -f $SiteUrl)
Write-Host ''
Write-Host '  Banco e API: Supabase (nuvem)'
Write-Host '  Para parar: .\stop.ps1'
Write-Host ' ============================================='
Write-Host ''

Start-Process $SiteUrl
