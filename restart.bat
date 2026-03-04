@echo off
taskkill /F /PID 14656 2>nul
timeout /t 2 /nobreak >nul
echo Server stopped
