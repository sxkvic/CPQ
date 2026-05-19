$ErrorActionPreference = "Stop"

Write-Host "Generating Prisma client..."
npm.cmd run db:generate

Write-Host "Running database migrations..."
npm.cmd run db:migrate

Write-Host "Seeding demo data..."
npm.cmd run db:seed

Write-Host "Database initialized."
