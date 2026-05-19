$ErrorActionPreference = "Stop"

Write-Host "Installing dependencies..."
npm.cmd install

Write-Host "Generating Prisma client..."
npm.cmd run db:generate

Write-Host "Starting web and mock API for preview..."
Start-Process -FilePath npm.cmd -ArgumentList @("run", "dev", "-w", "apps/web") -WorkingDirectory (Get-Location) -WindowStyle Hidden
Start-Process -FilePath npm.cmd -ArgumentList @("run", "mock", "-w", "apps/api") -WorkingDirectory (Get-Location) -WindowStyle Hidden

Write-Host "Preview is starting:"
Write-Host "  Web: http://localhost:5173"
Write-Host "  Mock API: http://localhost:3000/api/v1"
