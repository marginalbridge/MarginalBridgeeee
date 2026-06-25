# MarginalBridge-DEPLOY -> GitHub Desktop ilk kurulum
# Sag tik -> "PowerShell ile Calistir" veya:
#   powershell -ExecutionPolicy Bypass -File scripts\github-baslat.ps1

$ErrorActionPreference = "Stop"
$deploy = Join-Path $env:USERPROFILE "Desktop\MarginalBridge-DEPLOY"

if (-not (Test-Path $deploy)) {
  Write-Host "HATA: Klasor bulunamadi: $deploy" -ForegroundColor Red
  exit 1
}

Set-Location $deploy

$git = @(
  Get-ChildItem "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
  "git"
) | Where-Object { $_ } | Select-Object -First 1

if (-not $git -or ($git -ne "git" -and -not (Test-Path $git))) {
  Write-Host "HATA: Git bulunamadi. Once GitHub Desktop kurun:" -ForegroundColor Red
  Write-Host "https://desktop.github.com/"
  exit 1
}

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & $git @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Args -join ' ') basarisiz (exit $LASTEXITCODE)"
  }
}

Write-Host ""
Write-Host "=== MarginalBridge Git Kurulumu ===" -ForegroundColor Cyan
Write-Host "Klasor: $deploy"
Write-Host ""

if (-not (Test-Path ".git")) {
  Write-Host "[1/4] Git deposu olusturuluyor..." -ForegroundColor Yellow
  Invoke-Git init -b main
} else {
  Write-Host "[1/4] .git zaten mevcut" -ForegroundColor Green
}

Write-Host "[2/4] Dosyalar ekleniyor..." -ForegroundColor Yellow
Invoke-Git add -A

$status = Invoke-Git status --porcelain
if (-not $status) {
  Write-Host "[3/4] Commit edilecek degisiklik yok (zaten guncel)" -ForegroundColor Green
} else {
  Write-Host "[3/4] Ilk commit yapiliyor..." -ForegroundColor Yellow
  $msg = @"
MarginalBridge guncel surum

- NextAuth Google giris
- Panel tanitim reeli
- OAuth redirect duzeltmeleri
"@
  Invoke-Git commit -m $msg
  Write-Host "Commit tamamlandi." -ForegroundColor Green
}

Write-Host "[4/4] GitHub Desktop adimlari:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  A) YENI repo (Vercel henuz bagli degilse):" -ForegroundColor White
Write-Host "     1. GitHub Desktop ac"
Write-Host "     2. File -> Add local repository"
Write-Host "     3. Klasor: $deploy"
Write-Host "     4. Publish repository -> GitHub'a yukle"
Write-Host "     5. Vercel'de bu repoyu import et"
Write-Host ""
Write-Host "  B) MEVCUT repo (Vercel zaten bagliysa - ONERILEN):" -ForegroundColor White
Write-Host "     1. Vercel -> Settings -> Git -> repo adini not al"
Write-Host "     2. GitHub Desktop -> File -> Clone repository -> o repoyu sec"
Write-Host "     3. Clone klasorune DEPLOY dosyalarini kopyala (.git haric)"
Write-Host "     4. GitHub Desktop'ta Commit -> Push origin"
Write-Host ""
Write-Host "  C) Bu klasoru direkt ekle:" -ForegroundColor White
Write-Host "     1. GitHub Desktop -> File -> Add local repository"
Write-Host "     2. Klasor: $deploy"
Write-Host "     3. Commit -> Push origin (remote bagliysa)"
Write-Host ""

$hasRemote = $false
try {
  $remote = Invoke-Git remote get-url origin 2>$null
  if ($remote) { $hasRemote = $true }
} catch {}

if ($hasRemote) {
  Write-Host "Remote: $remote" -ForegroundColor Green
  Write-Host "Simdi GitHub Desktop'ta Push origin yapabilirsiniz." -ForegroundColor Green
} else {
  Write-Host "UYARI: Henuz GitHub remote yok." -ForegroundColor Yellow
  Write-Host "Yukaridaki A veya B adimlarindan birini uygulayin." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Deploy kontrol: https://www.marginalbridge.com/api/health/oauth" -ForegroundColor Cyan
Write-Host ""
