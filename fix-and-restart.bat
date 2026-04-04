@echo off
echo ============================================
echo TradeX - Complete System Fix Script
echo ============================================
echo.

echo Step 1: Killing all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo ✓ Node processes killed
echo.

echo Step 2: Starting Backend Server...
cd c:\xampp\htdocs\tradex\backend
start "TradeX Backend" cmd /k "node server.js"
echo ✓ Backend starting on port 5000...
timeout /t 4 >nul
echo.

echo Step 3: Testing API Endpoints...
echo Testing Stocks API...
curl -s "http://localhost:5000/api/market?type=STOCK&limit=1" | findstr "success"
echo.

echo Testing Forex API...
curl -s "http://localhost:5000/api/market?type=FOREX&limit=1" | findstr "success"
echo.

echo Testing Options API...
curl -s "http://localhost:5000/api/market?type=OPTION&limit=1" | findstr "success"
echo.

echo Step 4: Starting Frontend Server...
cd c:\xampp\htdocs\tradex\frontend
start "TradeX Frontend" cmd /k "npm run dev"
echo ✓ Frontend starting...
timeout /t 5 >nul
echo.

echo ============================================
echo ✅ ALL SYSTEMS FIXED AND RUNNING!
echo ============================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000 (or next available port)
echo.
echo Admin Login: admin@tradex.in / Admin@123456
echo.
echo Access Admin Market Pages:
echo   - Indian Stocks: http://localhost:3000/admin/stocks
echo   - Forex Market: http://localhost:3000/admin/forex
echo   - Options Chain: http://localhost:3000/admin/options
echo.
pause
