@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Starting backend on port 5000...
cd /d %~dp0backend
start "TradeX Backend" cmd /k npm start
timeout /t 3 /nobreak >nul
echo Starting frontend...
cd /d %~dp0frontend
start "TradeX Frontend" cmd /k npm run dev
echo.
echo Both servers starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173 (or next available port)
pause
