<#
.SYNOPSIS
  Deploys the SQL Server database in dependency order using sqlcmd.

.PARAMETER Server        SQL Server instance (default: localhost).
.PARAMETER Database      Target database name (default: CinemaBookingDB). Scripts hardcode CinemaBookingDB; another name is substituted on the fly.
.PARAMETER AppPassword   Password for the application login CinemaAppUser (required, never stored in files).
.PARAMETER SkipSeed      Do not load demo data.
.PARAMETER RunTests      Run tests 08 and 09 at the end.

WARNING: 01_schema.sql drops and recreates every table. Use only on a new/disposable database.
#>
param(
    [string]$Server = 'localhost',
    [string]$Database = 'CinemaBookingDB',
    [Parameter(Mandatory = $true)][string]$AppPassword,
    [switch]$SkipSeed,
    [switch]$RunTests
)

$ErrorActionPreference = 'Stop'
$db = Split-Path -Parent $PSScriptRoot

$steps = @(
    'schema/01_schema.sql',
    'functions/02_functions.sql',
    'views/03_views.sql',
    'triggers/04_triggers.sql',
    'procedures/system/system_procedures.sql',
    'procedures/auth/auth_procedures.sql',
    'procedures/customer/customer_procedures.sql',
    'procedures/manager/manager_procedures.sql',
    'procedures/support/support_procedures.sql',
    'procedures/admin/admin_procedures.sql',
    'security/06_security_rbac.sql'
)
if (-not $SkipSeed) { $steps += 'seed/07_seed_data.sql' }
if ($RunTests) { $steps += 'tests/08_tests_verification.sql', 'tests/09_tests_revisions.sql', 'tests/10_tests_seat_hold.sql' }

foreach ($step in $steps) {
    $path = Join-Path $db $step
    $sql = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
    $tmp = Join-Path ([IO.Path]::GetTempPath()) ("deploy_" + [IO.Path]::GetFileName($path))
    [IO.File]::WriteAllText($tmp, $sql.Replace('CinemaBookingDB', $Database), (New-Object Text.UTF8Encoding($true)))
    Write-Host "== $step"
    # -I: QUOTED_IDENTIFIER ON (required by filtered indexes); -b: stop with error code on failure
    & sqlcmd -S $Server -E -C -I -b -f 65001 -i $tmp -v AppPassword="$AppPassword"
    $code = $LASTEXITCODE
    Remove-Item $tmp -Force
    if ($code -ne 0) { throw "Failed at $step (sqlcmd exit code $code)" }
}
Write-Host 'Deployment finished.'
