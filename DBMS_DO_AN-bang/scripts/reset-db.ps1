param([switch]$Integrated, [string]$SeedDate)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$arguments = @((Join-Path $PSScriptRoot 'db/run.mjs'), 'reset')
if ($Integrated) { $arguments += '--integrated' }
if ($SeedDate) { $arguments += "--seed-date=$SeedDate" }
& node @arguments
exit $LASTEXITCODE
