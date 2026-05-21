$ErrorActionPreference = "Stop"

$listenPorts = @(3000, 5173)
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $listenPorts -contains $_.LocalPort } |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object {
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
  }

Write-Host "Development processes stopped."
