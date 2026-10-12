$ErrorActionPreference = 'Stop'
$workspaceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../..')).Path
$evidenceDirectory = Join-Path $PSScriptRoot 'browser-after'
New-Item -ItemType Directory -Path $evidenceDirectory -Force | Out-Null
$runId = [guid]::NewGuid().ToString('N')
$browsers = @(
  @{ Name = 'edge'; Executable = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'; Port = 9383 },
  @{ Name = 'chrome'; Executable = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; Port = 9384 }
)
$launched = @()
foreach ($browser in $browsers) {
  $profile = Join-Path $workspaceRoot ".audit-output/uxr3a-after-$($browser.Name)-$runId"
  $arguments = @('--headless=new', '--no-first-run', '--no-default-browser-check', "--remote-debugging-port=$($browser.Port)", "--user-data-dir=$profile", '--enable-logging=stderr', 'about:blank')
  $process = Start-Process -FilePath $browser.Executable -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $evidenceDirectory "$($browser.Name)-startup.log") -RedirectStandardOutput (Join-Path $evidenceDirectory "$($browser.Name)-stdout.log")
  $launched += @{ browser = $browser.Name; processId = $process.Id; port = $browser.Port; profile = $profile; mode = 'headless=new'; gpuFlags = @() }
}
Start-Sleep -Seconds 3
$launched | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 (Join-Path $evidenceDirectory 'browser-launch.json')
foreach ($browser in $browsers) {
  node (Join-Path $PSScriptRoot 'run-renderer-preflight.mjs') $browser.Port $browser.Name 'browser-after'
}
