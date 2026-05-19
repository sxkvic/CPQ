$web = Test-NetConnection -ComputerName localhost -Port 5173
$api = Test-NetConnection -ComputerName localhost -Port 3000

Write-Host "Web 5173: $($web.TcpTestSucceeded)"
Write-Host "API 3000: $($api.TcpTestSucceeded)"
