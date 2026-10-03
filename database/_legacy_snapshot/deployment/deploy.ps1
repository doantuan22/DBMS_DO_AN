<#
.SYNOPSIS
  Deploys the SQL Server database in dependency order using sqlcmd (shared logic: DeployCommon.ps1).

.PARAMETER Server        SQL Server instance (default: localhost).
.PARAMETER Database      Target database name (default: CinemaBookingDB). Scripts hardcode CinemaBookingDB; another name is substituted on the fly.
.PARAMETER AppLogin      Application login created/updated by the security step (default: CinemaAppUser; substituted on the fly).
.PARAMETER AppPassword   Password for the application login (required, never stored in files). Falls back to $env:DEPLOY_APP_PASSWORD.
.PARAMETER SkipSeed      Do not load demo data.
.PARAMETER RunTests      Run tests 08-16 at the end (08 creates an order: scratch database only).

WARNING: 01_schema.sql drops and recreates every table, and the security step resets the login password.
Use only on a new/disposable database. To build next to a database that is in use, prefer deploy-isolated.ps1,
which refuses the shared database and login names.
#>
param(
    [string]$Server = 'localhost',
    [string]$Database = 'CinemaBookingDB',
    [string]$AppLogin = 'CinemaAppUser',
    [string]$AppPassword = $env:DEPLOY_APP_PASSWORD,
    [switch]$SkipSeed,
    [switch]$RunTests
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'DeployCommon.ps1')
Invoke-Deploy -Server $Server -Database $Database -AppLogin $AppLogin -AppPassword $AppPassword -SkipSeed:$SkipSeed -RunTests:$RunTests
