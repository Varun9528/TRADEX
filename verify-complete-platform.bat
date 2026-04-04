@echo off
echo ====================================
echo COMPLETE MANUAL TRADING PLATFORM TEST
echo ====================================
echo.

echo STEP 1: Testing Backend Server...
curl -s http://localhost:5000/api/health > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend running on port 5000
) else (
    echo [ERROR] Backend not responding
    echo Please run: cd backend ^&^& npm start
    goto :END
)

echo.
echo STEP 2: Testing Market API...
curl -s http://localhost:5000/api/market | findstr /C:"success" > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Market API responding
) else (
    echo [ERROR] Market API not working
)

echo.
echo STEP 3: Testing Frontend...
curl -s http://localhost:5173 > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend running on port 5173
) else (
    echo [INFO] Frontend may not be running
    echo Run: cd frontend ^&^& npm run dev
)

echo.
echo STEP 4: Checking Database Seed Status...
echo Please verify database has instruments:
echo - At least 10 STOCK instruments
echo - At least 5 FOREX instruments
echo.
echo To seed database, run:
echo   cd backend
echo   npm run seed

echo.
echo ====================================
echo VERIFICATION COMPLETE
echo ====================================
echo.
echo Expected Features:
echo [1] Trading page loads without blank screen
echo [2] Watchlist shows instruments from database
echo [3] Chart displays and updates every 3 seconds
echo [4] Order panel visible with BUY/SELL buttons
echo [5] Indian/Forex market switch works
echo [6] Admin can add/edit/delete instruments
echo [7] Fund request system working
echo [8] Withdraw request system working
echo [9] Notifications display correctly
echo [10] Portfolio updates every 5 seconds
echo [11] Referral page functional
echo [12] Trade monitor shows all trades
echo [13] Mobile UI responsive
echo [14] User trading control (enable/disable)
echo.
echo If any feature not working:
echo 1. Check browser console (F12)
echo 2. Verify both servers running
echo 3. Clear cache and reload
echo 4. Check network tab for errors
echo.

:END
pause
