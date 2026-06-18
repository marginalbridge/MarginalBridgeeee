# MarginalBridge -> MarginalBridge-GITHUB masaustu senkronu
# GitHub'a yuklemeden once bu script calistirilir.

$src = Join-Path $env:USERPROFILE "Desktop\MarginalBridge"
$dst = Join-Path $env:USERPROFILE "Desktop\MarginalBridge-GITHUB"
$zip = Join-Path $env:USERPROFILE "Desktop\MarginalBridge-GITHUB-TAM-PAKET.zip"

if (-not (Test-Path $src)) {
  Write-Error "Kaynak bulunamadi: $src"
  exit 1
}

New-Item -ItemType Directory -Force -Path $dst | Out-Null

# /IS /IT: timestamp fark etmeksizin tum dosyalari zorla kopyala
robocopy $src $dst /MIR /IS /IT /XD node_modules .next .git /XF .env .env.local /NFL /NDL /NJH /NJS

$code = $LASTEXITCODE
if ($code -ge 8) {
  Write-Error "Senkron basarisiz (robocopy exit $code)"
  exit 1
}

# Yanlis zip cikarmadan kalan cop klasorler
$junk = @(
  (Join-Path $dst "types\lib"),
  (Join-Path $dst "types\components"),
  (Join-Path $dst "MarginalBridge-GITHUB")
)
foreach ($path in $junk) {
  if (Test-Path $path) {
    Remove-Item $path -Recurse -Force
    Write-Host "Silindi: $path"
  }
}

# Kritik dosya dogrulama
$postgresFile = Join-Path $dst "lib\db\postgres.ts"
$postgresOk = Select-String -Path $postgresFile -Pattern "CREATE TABLE IF NOT EXISTS connected_stores" -Quiet
$settingsOk = Test-Path (Join-Path $dst "app\dashboard\settings\page.tsx")
$buildFile = Join-Path $dst "lib\build-info.ts"
$buildId = (Select-String -Path $buildFile -Pattern 'APP_BUILD_ID = "([^"]+)"').Matches.Groups[1].Value

if (-not $postgresOk) {
  Write-Error "HATA: lib\db\postgres.ts guncel degil!"
  exit 1
}
if (-not $settingsOk) {
  Write-Error "HATA: Ayarlar sayfasi eksik!"
  exit 1
}

if (Test-Path $zip) { Remove-Item $zip -Force }
$stage = Join-Path $env:TEMP "mb-github-pack"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
robocopy $dst $stage /E /XD node_modules .next .git /XF .env .env.local /NFL /NDL /NJH /NJS | Out-Null
Compress-Archive -Path "$stage\*" -DestinationPath $zip -Force
Remove-Item $stage -Recurse -Force

Write-Host ""
Write-Host "=== SENKRON TAMAM ==="
Write-Host "Klasor : $dst"
Write-Host "Zip    : $zip"
Write-Host "Build  : $buildId"
Write-Host "Kontrol: https://marginal-bridgeeee.vercel.app/api/health/build"
Write-Host "GitHub Desktop ile MarginalBridge-GITHUB klasorunu PUSH edin."
