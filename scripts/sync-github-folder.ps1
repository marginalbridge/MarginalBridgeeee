# MarginalBridge -> masaustu DEPLOY klasoru (GitHub'a yuklenecek tam paket)
# GitHub'a yuklemeden once bu script calistirilir.

$src = Join-Path $env:USERPROFILE "Desktop\MarginalBridge"
$dst = Join-Path $env:USERPROFILE "Desktop\MarginalBridge-DEPLOY"
$zip = Join-Path $env:USERPROFILE "Desktop\MarginalBridge-DEPLOY.zip"

if (-not (Test-Path $src)) {
  Write-Error "Kaynak bulunamadi: $src"
  exit 1
}

New-Item -ItemType Directory -Force -Path $dst | Out-Null

# /IS /IT: timestamp fark etmeksizin tum dosyalari zorla kopyala
robocopy $src $dst /MIR /IS /IT /XD node_modules .next .git /XF .env .env.local *.zip /NFL /NDL /NJH /NJS

$code = $LASTEXITCODE
if ($code -ge 8) {
  Write-Error "Senkron basarisiz (robocopy exit $code)"
  exit 1
}

# Yanlis zip cikarmadan kalan cop klasorler
$junk = @(
  (Join-Path $dst "types\lib"),
  (Join-Path $dst "types\components"),
  (Join-Path $dst "types\types"),
  (Join-Path $dst "types\node_modules"),
  (Join-Path $dst "types\.next"),
  (Join-Path $dst "MarginalBridge-GITHUB"),
  (Join-Path $dst "MarginalBridge-DEPLOY")
)
foreach ($path in $junk) {
  if (Test-Path $path) {
    Remove-Item $path -Recurse -Force
    Write-Host "Silindi: $path"
  }
}

# Kritik dosya dogrulama
$checks = @(
  @{ Label = "postgres"; Path = "lib\db\postgres.ts"; Pattern = "CREATE TABLE IF NOT EXISTS connected_stores" },
  @{ Label = "settings"; Path = "app\dashboard\settings\page.tsx" },
  @{ Label = "shopify"; Path = "lib\shopify-client.ts" },
  @{ Label = "gtip-v7"; Path = "data\gtip-2026-full.json" },
  @{ Label = "build-info"; Path = "lib\build-info.ts" }
)

foreach ($check in $checks) {
  $file = Join-Path $dst $check.Path
  if (-not (Test-Path $file)) {
    Write-Error "HATA: Eksik dosya -> $($check.Path)"
    exit 1
  }
  if ($check.Pattern) {
    $ok = Select-String -Path $file -Pattern $check.Pattern -Quiet
    if (-not $ok) {
      Write-Error "HATA: $($check.Label) dosyasi guncel degil -> $($check.Path)"
      exit 1
    }
  }
}

$buildFile = Join-Path $dst "lib\build-info.ts"
$buildId = (Select-String -Path $buildFile -Pattern 'APP_BUILD_ID = "([^"]+)"').Matches.Groups[1].Value
$fileCount = (Get-ChildItem $dst -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.next\\' }).Count

if (Test-Path $zip) { Remove-Item $zip -Force }
$stage = Join-Path $env:TEMP "mb-deploy-pack"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
robocopy $dst $stage /E /XD node_modules .next .git /XF .env .env.local /NFL /NDL /NJH /NJS | Out-Null
Compress-Archive -Path "$stage\*" -DestinationPath $zip -Force
Remove-Item $stage -Recurse -Force

$zipMb = [math]::Round((Get-Item $zip).Length / 1MB, 2)

Write-Host ""
Write-Host "=== DEPLOY KLASORU HAZIR ==="
Write-Host "Klasor   : $dst"
Write-Host "Zip      : $zip ($zipMb MB)"
Write-Host "Dosya    : $fileCount adet"
Write-Host "Build    : $buildId"
Write-Host ""
Write-Host "GitHub Desktop -> Add Local Repository -> $dst -> Commit -> Push"
Write-Host "Deploy kontrol: https://marginal-bridgeeee.vercel.app/api/health/build"
