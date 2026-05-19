$ErrorActionPreference = "Stop"

$processes = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | Where-Object {
  $_.CommandLine -like '*apps/web*' -or
  $_.CommandLine -like '*vite.js*' -or
  $_.CommandLine -like '*mock-server.ts*' -or
  $_.CommandLine -like '*run mock*' -or
  $_.CommandLine -like '*apps/api*' -or
  $_.CommandLine -like '*nest.js*'
}

foreach ($process in $processes) {
  Stop-Process -Id $process.ProcessId -Force
}

Write-Host "Development processes stopped."
