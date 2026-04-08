# Convierte un archivo de imagen a PNG real en la misma ruta (sobrescribe).
param(
  [Parameter(Mandatory = $true)]
  [string] $ImagePath
)
$ErrorActionPreference = 'Stop'
$full = (Resolve-Path -LiteralPath $ImagePath).Path
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($full)
$tmp = Join-Path $env:TEMP ('coverlens-png-' + [guid]::NewGuid().ToString() + '.png')
try {
  $bmp = New-Object System.Drawing.Bitmap $img.Width, $img.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  [void]$g.DrawImage($img, 0, 0, $img.Width, $img.Height)
  $g.Dispose()
  $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
finally {
  $img.Dispose()
}
Remove-Item -LiteralPath $full -Force
Move-Item -LiteralPath $tmp -Destination $full -Force
