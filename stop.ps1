# =============================================================
#  NemyCookies - encerra o ambiente local
#
#  Uso: .\stop.ps1
#  O banco e a API ficam no Supabase (nuvem) e nao sao afetados.
# =============================================================

Write-Host ''
Write-Host ' ============================================='
Write-Host '  NemyCookies - Encerrando o site local'
Write-Host ' ============================================='
Write-Host ''

$portas = @(5173, 5174)
$achou = $false

foreach ($porta in $portas) {
    $conns   = Get-NetTCPConnection -State Listen -LocalPort $porta -ErrorAction SilentlyContinue
    $procIds = @($conns | Select-Object -ExpandProperty OwningProcess -Unique)
    foreach ($procId in $procIds) {
        taskkill /PID $procId /T /F *> $null
        Write-Host ('  Porta {0}: processo {1} encerrado.' -f $porta, $procId) -ForegroundColor Green
        $achou = $true
    }
}

if (-not $achou) { Write-Host '  Nada rodando.' }

Write-Host ''
Write-Host '  Encerrado. (Supabase continua no ar, como esperado.)'
Write-Host ''
