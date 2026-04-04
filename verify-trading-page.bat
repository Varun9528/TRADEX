@echo off
echo ====================================
echo TRADING PLATFORM VERIFICATION TEST
echo ====================================
echo.

echo Testing Backend API...
curl -s http://localhost:5000/api/market > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is running on port 5000
) else (
    echo [ERROR] Backend is not responding
    echo.
    echo Please start backend: cd backend ^&^& npm start
    goto :END
)

echo.
echo Testing Market Data Response...
curl -s http://localhost:5000/api/market | findstr /C:"success" > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Market API returning data
) else (
    echo [WARNING] Market API may have issues
)

echo.
echo Testing Frontend...
curl -s http://localhost:5173 > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is running
) else (
    echo [INFO] Frontend may not be running
    echo Start with: cd frontend ^&^& npm run dev
)

echo.
echo ====================================
echo VERIFICATION COMPLETE
echo ====================================
echo.
echo Expected Result:
echo - Trading page loads successfully
echo - Watchlist shows instruments
echo - Chart renders properly
echo - Buy/Sell buttons visible
echo - Forex switch works
echo - No blank screen
echo.
echo If issues persist:
echo 1. Check console for errors (F12)
echo 2. Verify both servers running
echo 3. Clear browser cache
echo 4. Check network tab for failed API calls
echo.

:END
pause
