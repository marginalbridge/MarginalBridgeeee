$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$extractDir = Join-Path $root "scripts\tmp-gtip\extracted\2026 TGTC\2026 TGTC"
$outJson = Join-Path $root "data\gtip-2026-full.json"

$chapterTitles = @{
  "01" = "Canlı hayvanlar"
  "02" = "Et ve yenilebilir sakatat"
  "03" = "Balık, kabuklu hayvanlar"
  "04" = "Süt ürünleri, yumurta, bal"
  "05" = "Diğer hayvansal menşeli ürünler"
  "06" = "Canlı ağaçlar ve bitkiler"
  "07" = "Sebzeler"
  "08" = "Meyveler ve sert kabuklu meyveler"
  "09" = "Kahve, çay, baharat"
  "10" = "Tahıllar"
  "11" = "Değirmencilik ürünleri"
  "12" = "Yağlı tohum ve meyveler"
  "13" = "Reçine, sakız, bitkisel öz"
  "14" = "Bitkisel dokuma malzemeleri"
  "15" = "Hayvansal ve bitkisel yağlar"
  "16" = "Et, balık müstahzarları"
  "17" = "Şeker ve şekerlemeler"
  "18" = "Kakao ve müstahzarları"
  "19" = "Tahıl, un, süt müstahzarları"
  "20" = "Sebze, meyve müstahzarları"
  "21" = "Çeşitli gıda müstahzarları"
  "22" = "Alkollü ve alkolsüz içecekler"
  "23" = "Gıda sanayi kalıntıları, hayvan yemi"
  "24" = "Tütün ve mamulleri"
  "25" = "Tuz, kükürt, taş, alçı, çimento"
  "26" = "Cevherler, cüruf ve kül"
  "27" = "Mineral yakıtlar, yağlar"
  "28" = "İnorganik kimyasallar"
  "29" = "Organik kimyasallar"
  "30" = "Eczacılık ürünleri"
  "31" = "Gübreler"
  "32" = "Boyalar, pigmentler"
  "33" = "Uçucu yağlar, kozmetik"
  "34" = "Sabun, deterjan, mum"
  "35" = "Albüminoid maddeler, tutkal"
  "36" = "Barut, patlayıcı maddeler"
  "37" = "Fotoğraf, sinema malzemeleri"
  "38" = "Muhtelif kimyasal ürünler"
  "39" = "Plastikler ve mamulleri"
  "40" = "Kauçuk ve mamulleri"
  "41" = "Ham deri, kösele"
  "42" = "Deri eşya, çantalar"
  "43" = "Kürkler ve mamulleri"
  "44" = "Ahşap ve ahşap eşya"
  "45" = "Mantar, hasır eşya"
  "46" = "Hasır, örgü eşya"
  "47" = "Kağıt hamuru"
  "48" = "Kağıt ve karton"
  "49" = "Basılı kitap, gazete"
  "50" = "İpek"
  "51" = "Yün, hayvan kılı"
  "52" = "Pamuk"
  "53" = "Diğer bitkisel tekstil lifleri"
  "54" = "Sentetik filament iplik"
  "55" = "Sentetik devamsız lifler"
  "56" = "Vat, keçe, ip"
  "57" = "Halılar ve tekstil döşeme"
  "58" = "Özel dokuma kumaşlar"
  "59" = "Emprenye, kaplanmış tekstil"
  "60" = "Örme kumaşlar"
  "61" = "Örme giyim eşyası"
  "62" = "Örme olmayan giyim"
  "63" = "Diğer hazır tekstil eşya"
  "64" = "Ayakkabılık"
  "65" = "Başlıklar ve aksesuarları"
  "66" = "Şemsiye, baston"
  "67" = "İşlenmiş tüy, yapay çiçek"
  "68" = "Taş, alçı, mika eşya"
  "69" = "Seramik ürünler"
  "70" = "Cam ve cam eşya"
  "71" = "Kıymetli taşlar, metal"
  "72" = "Demir ve çelik"
  "73" = "Demir veya çelik eşya"
  "74" = "Bakır ve bakır eşya"
  "75" = "Nikel ve nikel eşya"
  "76" = "Alüminyum ve alüminyum eşya"
  "78" = "Kurşun ve kurşun eşya"
  "79" = "Çinko ve çinko eşya"
  "80" = "Kalay ve kalay eşya"
  "81" = "Diğer adi metaller"
  "82" = "Adi metal aletler"
  "83" = "Adi metal eşya"
  "84" = "Nükleer reaktörler, makinalar"
  "85" = "Elektrikli makine ve cihazlar"
  "86" = "Demiryolu taşıtları"
  "87" = "Motorlu kara taşıtları"
  "88" = "Hava taşıtları"
  "89" = "Gemiler ve yüzer yapılar"
  "90" = "Optik, tıbbi, ölçü aletleri"
  "91" = "Saatler"
  "92" = "Müzik aletleri"
  "93" = "Silah ve mühimmat"
  "94" = "Mobilya, aydınlatma"
  "95" = "Oyuncak, spor malzemeleri"
  "96" = "Muhtelif mamul eşya"
  "97" = "Sanat eserleri, koleksiyon"
  "99" = "Özel amaçlı kodlar"
}

function Get-KdvRate([int]$chapter) {
  if ($chapter -ge 1 -and $chapter -le 24) { return 0.01 }
  if ($chapter -in 61, 62, 63, 64) { return 0.10 }
  return 0.20
}

function Normalize-GtipCode([string]$raw) {
  $digits = ($raw -replace "[^\d]", "")
  if ($digits.Length -lt 12) { return $null }
  return $digits.Substring(0, 12)
}

function Get-Keywords([string]$text) {
  $clean = ($text.ToLower() -replace "[^\p{L}\p{N}\s]", " ")
  $words = $clean -split "\s+" | Where-Object { $_.Length -ge 3 } | Select-Object -Unique
  return @($words | Select-Object -First 12)
}

function Parse-Duty([string]$raw) {
  if ([string]::IsNullOrWhiteSpace($raw)) { return 0 }
  $normalized = ($raw -replace ",", ".") -replace "[^\d\.]", ""
  if ($normalized -eq "") { return 0 }
  $value = [double]$normalized
  if ($value -gt 1) { return [math]::Round($value / 100, 4) }
  return [math]::Round($value, 4)
}

$files = Get-ChildItem $extractDir -Filter "* fas*.xls" | Sort-Object Name
Write-Host "Parsing $($files.Count) chapter files..."

$entries = @{}
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

foreach ($file in $files) {
  if ($file.Name -match "^(\d{2})\s") {
    $chapterNum = [int]$Matches[1]
  } else {
    continue
  }

  $chapterKey = "{0:D2}" -f $chapterNum
  $chapterTitle = "$chapterKey - $($chapterTitles[$chapterKey])"
  if (-not $chapterTitles[$chapterKey]) {
    $chapterTitle = "$chapterKey - Fasıl $chapterKey"
  }

  Write-Host "  Chapter $chapterKey : $($file.Name)"
  $wb = $excel.Workbooks.Open($file.FullName)
  $ws = $wb.Worksheets.Item(1)
  $rows = $ws.UsedRange.Rows.Count

  for ($r = 1; $r -le $rows; $r++) {
    $pos = $ws.Cells.Item($r, 1).Text.Trim()
    $desc = $ws.Cells.Item($r, 2).Text.Trim()
    $unit = $ws.Cells.Item($r, 3).Text.Trim()
    $dutyRaw = $ws.Cells.Item($r, 4).Text.Trim()

    if ($pos -notmatch "^\d{4}\.\d{2}\.\d{2}\.\d{2}\.\d{2}") { continue }
    if ([string]::IsNullOrWhiteSpace($desc)) { continue }

    $code = Normalize-GtipCode $pos
    if (-not $code) { continue }

    $duty = Parse-Duty $dutyRaw
    $kdv = Get-KdvRate $chapterNum
    $keywords = Get-Keywords $desc

    $entries[$code] = [ordered]@{
      code = $code
      description = ($desc -replace "\s+", " ").Trim()
      chapter = $chapterTitle
      unit = if ($unit) { $unit } else { "Adet" }
      customsDutyRate = $duty
      additionalDutyRate = 0
      kdvRate = $kdv
      keywords = $keywords
      year = 2026
      source = "Turk Gumruk Tarife Cetveli (Karar Sayisi: 10781, RG 30.12.2025/33123)"
    }
  }

  $wb.Close($false)
}

$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

$sorted = $entries.Values | Sort-Object code
$output = [ordered]@{
  meta = [ordered]@{
    year = 2026
    version = 7
    source = "Turk Gumruk Tarife Cetveli (Karar Sayisi: 10781, RG 30.12.2025/33123)"
    description = "2026 resmi istatistik pozisyonlari - Ticaret Bakanligi TGTC tam import"
    entryCount = $sorted.Count
    importedAt = (Get-Date).ToUniversalTime().ToString("o")
  }
  entries = $sorted
}

$json = $output | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($outJson, $json, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $($sorted.Count) entries to $outJson"
