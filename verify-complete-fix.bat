@echo off
echo ========================================
echo COMPLETE FIX VERIFICATION SCRIPT
echo Admin Controlled Market System
echo ========================================
echo.

echo [1/5] Checking Backend Server...
curl -s http://localhost:5000/api/market >nul 2>&1 && echo ✓ Backend is running on port 5000 || echo ✗ Backend NOT running
echo.

echo [2/5] Checking Frontend Server...
curl -s http://localhost:3001 >nul 2>&1 && echo ✓ Frontend is running on port 3001 || echo ✗ Frontend NOT running
echo.

echo [3/5] Testing Market API...
curl -s http://localhost:5000/api/market | findstr "success" >nul 2>&1 && echo ✓ Market API responding || echo ✗ Market API error
echo.

echo [4/5] Checking Instrument Count...
curl -s http://localhost:5000/api/market | findstr "count" >nul 2>&1 && echo ✓ Instruments found in database || echo ✗ No instruments
echo.

echo [5/5] Verifying Stock Types...
curl -s "http://localhost:5000/api/market?type=STOCK" | findstr "RELIANCE" >nul 2>&1 && echo ✓ Indian Stocks loaded (RELIANCE) || echo ✗ Stocks missing
curl -s "http://localhost:5000/api/market?type=FOREX" | findstr "EURUSD" >nul 2>&1 && echo ✓ Forex Pairs loaded (EURUSD) || echo ✗ Forex missing
echo.

echo ========================================
echo TEST SUMMARY
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3001
echo.
echo Admin Login:
echo   Email: admin@tradex.in
echo   Password: Admin@123456
echo.
echo Test URLs:
echo   Trading Page: http://localhost:3001/trading
echo   Admin Market: http://localhost:3001/admin/market
echo   Dashboard:    http://localhost:3001/dashboard
echo   Watchlist:    http://localhost:3001/watchlist
echo.
echo ========================================
