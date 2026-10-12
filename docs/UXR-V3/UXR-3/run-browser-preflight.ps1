$ErrorActionPreference = 'Stop'
$workspaceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../..')).Path
$outputDirectory = Join-Path $PSScriptRoot 'browser-gui'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$runId = [guid]::NewGuid().ToString('N')
$browsers = @(
  @{ Name = 'edge'; Executable = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'; Port = 9391 },
  @{ Name = 'chrome'; Executable = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; Port = 9392 }
)
$launched = @()
foreach ($browser in $browsers) {
  $profile = Join-Path $workspaceRoot ".audit-output/uxr3-gui-$($browser.Name)-$runId"
  $arguments = @('--no-first-run', '--no-default-browser-check', "--remote-debugging-port=$($browser.Port)", "--user-data-dir=$profile", '--enable-logging=stderr', 'about:blank')
  $process = Start-Process -FilePath $browser.Executable -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $outputDirectory "$($browser.Name)-startup.log") -RedirectStandardOutput (Join-Path $outputDirectory "$($browser.Name)-stdout.log")
  $launched += @{ browser = $browser.Name; processId = $process.Id; port = $browser.Port; profile = $profile; mode = 'GUI (no headless flag)'; gpuFlags = @() }
}
Start-Sleep -Seconds 3
$launched | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 (Join-Path $outputDirectory 'browser-launch.json')
foreach ($browser in $browsers) {
  node (Join-Path $PSScriptRoot 'run-renderer-preflight.mjs') $browser.Port $browser.Name 'browser-gui'
}
