$ErrorActionPreference = "Stop"

Write-Host "Installing dependencies..."
npm.cmd install

Write-Host "Generating Prisma client..."
npm.cmd run db:generate

Write-Host "Starting web and mock API for preview..."
$root = (Get-Location).Path
Start-Process -FilePath cmd.exe -ArgumentList @("/d", "/s", "/c", "npm run dev -w apps/web") -WorkingDirectory $root -WindowStyle Hidden
Start-Process -FilePath cmd.exe -ArgumentList @("/d", "/s", "/c", "npm run mock -w apps/api") -WorkingDirectory $root -WindowStyle Hidden

Write-Host "Preview is starting:"
Write-Host "  Web: http://localhost:5173"
Write-Host "  Mock API: http://localhost:3000/api/v1"
