Param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-CurrentBranch {
  $branch = git rev-parse --abbrev-ref HEAD 2>$null
  if (-not $branch) {
    throw "No se pudo detectar la rama actual."
  }
  return $branch.Trim()
}

function Ensure-Branch([string]$branchName) {
  git show-ref --verify --quiet "refs/heads/$branchName"
  if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: rama '$branchName' ya existe."
    return
  }

  git branch "$branchName"
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear la rama '$branchName'."
  }
  Write-Host "Creada rama '$branchName'."
}

git rev-parse --is-inside-work-tree 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Este script debe ejecutarse dentro de un repositorio git."
}

git rev-parse --quiet --verify HEAD *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Aun no hay commits. Haz el primer commit y vuelve a ejecutar 'npm run setup:gitflow'."
}

$current = Get-CurrentBranch
if ($current -eq "master") {
  git branch -m master main
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo renombrar 'master' a 'main'."
  }
  $current = "main"
  Write-Host "Renombrada rama base: master -> main."
}

Ensure-Branch "develop"
Ensure-Branch "platform/android"
Ensure-Branch "platform/ios"

Write-Host ""
Write-Host "Estructura de ramas lista."
Write-Host "Rama actual: $current"
