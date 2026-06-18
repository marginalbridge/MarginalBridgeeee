# GitHub web arayuzu tek seferde en fazla 100 dosya kabul eder.
# Bu script projeyi 90'ar dosyalik gruplara ayirir (Masaustu\MarginalBridge-GITHUB-Batch).
# Her klasoru sirayla GitHub'a yukleyin; her commit'ten sonra bir sonrakine gecin.

$src = Join-Path $PSScriptRoot ".."
$src = (Resolve-Path $src).Path
$dest = Join-Path ([Environment]::GetFolderPath("Desktop")) "MarginalBridge-GITHUB-Batch"
$batchSize = 90
$excludeDirs = @("node_modules", ".next", ".vercel", ".git")

if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Path $dest -Force | Out-Null

$files = @()
Get-ChildItem -Path $src -Recurse -File -Force | ForEach-Object {
  $rel = $_.FullName.Substring($src.Length + 1)
  $skip = $false
  foreach ($d in $excludeDirs) {
    if ($rel -like "$d*" -or $rel -like "*\$d\*") { $skip = $true; break }
  }
  if ($skip) { return }
  if ($_.Name -eq ".env" -or $_.Name -eq "tsconfig.tsbuildinfo") { return }
  $files += [PSCustomObject]@{ Rel = $rel; Full = $_.FullName }
}

$batchNum = 1
for ($i = 0; $i -lt $files.Count; $i += $batchSize) {
  $batchDir = Join-Path $dest ("Batch-{0:D2}" -f $batchNum)
  New-Item -ItemType Directory -Path $batchDir -Force | Out-Null
  $slice = $files[$i..([Math]::Min($i + $batchSize - 1, $files.Count - 1))]
  foreach ($f in $slice) {
    $target = Join-Path $batchDir $f.Rel
    $parent = Split-Path $target -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Copy-Item -Path $f.Full -Destination $target -Force
  }
  $batchNum++
}

$readme = @"
MarginalBridge - GitHub toplu yukleme
=====================================
Toplam dosya: $($files.Count)
Batch sayisi: $($batchNum - 1) (her biri en fazla $batchSize dosya)

NASIL YUKLENIR
1. GitHub repo acin (bos veya mevcut).
2. Batch-01 icindeki TUM dosya ve klasorleri surukleyip repo KOKUNE yukleyin.
3. Commit: "Batch 01"
4. Tekrar "Add file" -> Batch-02 icindekileri yukleyin (klasor yapisini koruyun).
5. Batch-03, 04 ... son batch'e kadar tekrarlayin.

ONEMLI
- node_modules ve .next YUKLEMEYIN (Vercel kendisi kurar).
- Klasor adlari Ingilizce olmali: app, components, lib (Turkce degil).

DAHA KOLAY YOL (onerilen)
- GitHub Desktop: https://desktop.github.com
  Masaustu\MarginalBridge klasorunu surukleyip Publish repository deyin.
- Veya Vercel CLI (GitHub gerekmez):
  cd Masaustu\MarginalBridge
  npx vercel login
  npx vercel --prod
"@
Set-Content -Path (Join-Path $dest "OKU-BENI.txt") -Value $readme -Encoding UTF8

Write-Host "Hazir: $dest"
Write-Host "Toplam $($files.Count) dosya -> $($batchNum - 1) batch"
