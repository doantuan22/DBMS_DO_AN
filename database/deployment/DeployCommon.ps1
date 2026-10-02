# Shared deployment logic, dot-sourced by deploy.ps1 and deploy-isolated.ps1.
# Replays the SQL files in dependency order with sqlcmd. The scripts under database/ hardcode the names
# CinemaBookingDB (database) and CinemaAppUser (application login); both are substituted on the fly, so the same
# files can build a disposable database next to a database that is in use.

$script:DefaultDatabase = 'CinemaBookingDB'
$script:DefaultLogin = 'CinemaAppUser'

function Get-DeploySteps {
    param([switch]$SkipSeed, [switch]$RunTests)
    # Migrations 001-006 are replayed after the seed, exactly as a database that was upgraded step by step gets them:
    # they are idempotent, and 003-006 (CREATE OR ALTER / ALTER of procedures) define the final version of six
    # procedures, so the result is identical to the database in use. Some of them have no USE line; Invoke-Deploy
    # runs every step with -d <database> instead of editing those files. Migration 007 does not exist (see 008 header).
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
    $steps += 'migrations/001_index_revision.sql', 'migrations/002_seat_hold.sql', 'migrations/003_complaint_order_ownership.sql',
              'migrations/004_manager_showtime_list.sql', 'migrations/005_support_status_history_atomicity.sql',
              'migrations/006_support_procedure_authorization.sql'
    $steps += 'migrations/008_admin_global_portal.sql'
    $steps += 'migrations/009_cinema_images.sql'
    $steps += 'migrations/010_cinema_image_fixes.sql'
    $steps += 'migrations/011_cinema_image_update_lock.sql'
    $steps += 'migrations/012_booking_limits_and_pricing.sql'
    if ($RunTests) {
        $steps += 'tests/08_tests_verification.sql', 'tests/09_tests_revisions.sql', 'tests/10_tests_seat_hold.sql',
                  'tests/11_tests_complaint_order_ownership.sql', 'tests/12_tests_cinema_images.sql',
                  'tests/13_tests_cinema_image_fixes.sql', 'tests/14_tests_cinema_image_update_lock.sql',
                  'tests/15_tests_booking_limits.sql'
    }
    return $steps
}

# Pre-flight: an isolated build must neither reuse the database nor the login that is in use.
function Assert-IsolatedTarget {
    param([string]$Database, [string]$AppLogin, [switch]$AllowSharedTarget)
    if ($AllowSharedTarget) { return }
    if ($Database -eq $script:DefaultDatabase) {
        throw "Refusing to run: database '$Database' is the shared/live name. Use another name, or pass -AllowSharedTarget if you really mean it."
    }
    if ($AppLogin -eq $script:DefaultLogin) {
        throw "Refusing to run: login '$AppLogin' is the shared/live login (the security step would reset its password). Use another login, or pass -AllowSharedTarget."
    }
}

function Test-DatabaseExists {
    param([string]$Server, [string]$Database)
    $result = & sqlcmd -S $Server -E -C -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = N'$Database'"
    if ($LASTEXITCODE -ne 0) { throw "Could not query databases on $Server" }
    return (($result | Select-Object -First 1).Trim() -ne '0')
}

# Reads a SQL file, removes :setvar, substitutes names and verifies that nothing still addresses the default names.
function Get-PreparedSql {
    param([string]$Path, [string]$Database, [string]$AppLogin)
    $sql = [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)
    # A :setvar inside a script would override the -v value; the password comes from the caller
    $sql = [regex]::Replace($sql, '(?m)^:setvar[^\r\n]*\r?\n', '')
    $sql = $sql.Replace($script:DefaultLogin, $AppLogin).Replace($script:DefaultDatabase, $Database)
    if ($Database -ne $script:DefaultDatabase) {
        $suffix = if ($Database.StartsWith($script:DefaultDatabase)) { $Database.Substring($script:DefaultDatabase.Length) } else { $null }
        $pattern = if ($suffix) { $script:DefaultDatabase + '(?!' + [regex]::Escape($suffix) + ')' } else { $script:DefaultDatabase }
        if ([regex]::IsMatch($sql, $pattern)) { throw "Pre-flight failed: $Path still addresses $($script:DefaultDatabase) after substitution." }
    }
    if ($AppLogin -ne $script:DefaultLogin -and $sql.Contains($script:DefaultLogin) -and -not $AppLogin.Contains($script:DefaultLogin)) {
        throw "Pre-flight failed: $Path still addresses login $($script:DefaultLogin) after substitution."
    }
    return $sql
}

function Invoke-Deploy {
    param(
        [string]$Server, [string]$Database, [string]$AppLogin, [string]$AppPassword,
        [switch]$SkipSeed, [switch]$RunTests
    )
    if (-not $AppPassword) { throw 'The application login password is required (parameter or DEPLOY_APP_PASSWORD).' }
    $root = Split-Path -Parent $PSScriptRoot
    $first = $true
    foreach ($step in (Get-DeploySteps -SkipSeed:$SkipSeed -RunTests:$RunTests)) {
        $path = Join-Path $root $step
        $sql = Get-PreparedSql -Path $path -Database $Database -AppLogin $AppLogin
        $tmp = Join-Path ([IO.Path]::GetTempPath()) ('deploy_' + [IO.Path]::GetFileName($path))
        [IO.File]::WriteAllText($tmp, $sql, (New-Object Text.UTF8Encoding($true)))
        Write-Host "== $step"
        # -I: QUOTED_IDENTIFIER ON (filtered indexes); -b: stop on error; -d: run in the target database even if a
        # file has no USE line (the schema step creates the database, so it cannot use -d)
        $sqlcmdArgs = @('-S', $Server, '-E', '-C', '-I', '-b', '-f', '65001')
        if (-not $first) { $sqlcmdArgs += @('-d', $Database) }
        $sqlcmdArgs += @('-i', $tmp, '-v', "AppPassword=$AppPassword")
        & sqlcmd @sqlcmdArgs
        $code = $LASTEXITCODE
        Remove-Item $tmp -Force
        if ($code -ne 0) { throw "Failed at $step (sqlcmd exit code $code)" }
        $first = $false
    }
    Write-Host 'Deployment finished.'
}
