$port = 5000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($process) {
    echo "Killing process $($process.OwningProcess) on port $port"
    Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
$env:NODE_ENV="development"
$env:PORT="5000"
npx tsx server/index.ts
