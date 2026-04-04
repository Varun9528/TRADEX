@echo off
echo ============================================
echo TradeX System Verification Script
echo ============================================
echo.

set BACKEND=http://localhost:5000
set FRONTEND=http://localhost:3000

echo Step 1: Checking Backend Server...
curl -s "%BACKEND%/api/market?type=STOCK^&limit=1" | findstr "success" >nul
if %errorlevel% equ 0 (
    echo ✓ Backend is running on port 5000
) else (
    echo ✗ Backend is NOT running!
    echo Please run: fix-and-restart.bat
    pause
    exit /b 1
)
echo.

echo Step 2: Testing API Endpoints...
echo.

echo [1/6] Testing Stocks API...
curl -s "%BACKEND%/api/market?type=STOCK^&limit=1" | python -c "import sys,json; d=json.load(sys.stdin); print(f'   Stocks: {d[\"count\"]} instruments' if d['count']>0 else '   ✗ No stocks found')"
echo.

echo [2/6] Testing Forex API...
curl -s "%BACKEND%/api/market?type=FOREX^&limit=1" | python -c "import sys,json; d=json.load(sys.stdin); print(f'   Forex: {d[\"count\"]} pairs' if d['count']>0 else '   ✗ No forex found')"
echo.

echo [3/6] Testing Options API...
curl -s "%BACKEND%/api/market?type=OPTION^&limit=1" | python -c "import sys,json; d=json.load(sys.stdin); print(f'   Options: {d[\"count\"]} contracts' if d['count']>0 else '   ✗ No options found')"
echo.

echo [4/6] Testing Admin Trades API...
curl -s "%BACKEND%/api/admin/trades" | findstr "success" >nul
if %errorlevel% equ 0 (
    echo    ✓ Trades API working
) else (
    echo    ✗ Trades API failed
)
echo.

echo [5/6] Testing Fund Requests API...
curl -s "%BACKEND%/api/admin/fund-requests" | findstr "success" >nul
if %errorlevel% equ 0 (
    echo    ✓ Fund Requests API working
) else (
    echo    ✗ Fund Requests API failed
)
echo.

echo [6/6] Testing Withdraw Requests API...
curl -s "%BACKEND%/api/admin/withdraw-requests" | findstr "success" >nul
if %errorlevel% equ 0 (
    echo    ✓ Withdraw Requests API working
) else (
    echo    ✗ Withdraw Requests API failed
)
echo.

echo ============================================
echo Summary
echo ============================================
echo.
echo Backend Status: RUNNING
echo Database: MongoDB Atlas (tradex_india)
echo Total Instruments: 505 (130 stocks + 47 forex + 328 options)
echo.
echo Next Steps:
echo 1. Open browser: %FRONTEND%
echo 2. Login as admin: admin@tradex.in / Admin@123456
echo 3. Test admin pages:
echo    - /admin/stocks
echo    - /admin/forex
echo    - /admin/options
echo 4. Test trading page: /trading
echo.
echo If any API tests failed above, check:
echo   - Backend console for errors
echo   - MongoDB connection status
echo   - Network connectivity
echo.
pause
