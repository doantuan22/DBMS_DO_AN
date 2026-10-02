<#
.SYNOPSIS
  Builds a disposable copy of the database (own database name and own application login) from the repository only.
  It refuses to run against the shared database/login, so it cannot damage a database that is in use.

.PARAMETER Server        SQL Server instance (default: localhost).
.PARAMETER Database      Target database name (required), e.g. CinemaBookingDB_RepoCheck. Must not be CinemaBookingDB.
.PARAMETER AppLogin      Application login to create (required), e.g. CinemaRepoUser. Must not be CinemaAppUser.
.PARAMETER SkipSeed      Do not load demo data.
.PARAMETER RunTests      Run tests 08-15 at the end.
.PARAMETER Recreate      Drop the target database first if it already exists (never allowed for the shared name).
.PARAMETER AllowSharedTarget  Explicit confirmation to disable the safety check (not recommended).

The login password is read from the DEPLOY_APP_PASSWORD environment variable only.

Remove a disposable build:
  sqlcmd -S localhost -E -C -Q "ALTER DATABASE <db> SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE <db>;"
  sqlcmd -S localhost -E -C -Q "DROP LOGIN <login>;"
#>
param(
    [string]$Server = 'localhost',
    [Parameter(Mandatory = $true)][string]$Database,
    [Parameter(Mandatory = $true)][string]$AppLogin,
    [switch]$SkipSeed,
    [switch]$RunTests,
    [switch]$Recreate,
    [switch]$AllowSharedTarget
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'DeployCommon.ps1')
Assert-IsolatedTarget -Database $Database -AppLogin $AppLogin -AllowSharedTarget:$AllowSharedTarget
if (-not $env:DEPLOY_APP_PASSWORD) { throw 'Set the DEPLOY_APP_PASSWORD environment variable (the login password is never accepted as a parameter).' }

if (Test-DatabaseExists -Server $Server -Database $Database) {
    if (-not $Recreate) { throw "Database '$Database' already exists. The schema script cannot rebuild over a database that already has the later migrations; pass -Recreate to drop it first." }
    if ($Database -eq $script:DefaultDatabase) { throw 'Recreate is never allowed for the shared database name.' }
    Write-Host "== dropping $Database"
    & sqlcmd -S $Server -E -C -b -Q "ALTER DATABASE [$Database] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$Database];"
    if ($LASTEXITCODE -ne 0) { throw "Could not drop $Database" }
}
Invoke-Deploy -Server $Server -Database $Database -AppLogin $AppLogin -AppPassword $env:DEPLOY_APP_PASSWORD -SkipSeed:$SkipSeed -RunTests:$RunTests
