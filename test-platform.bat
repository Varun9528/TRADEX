@echo off
echo ====================================
echo TESTING TRADING PLATFORM
echo ====================================
echo.

echo 1. Testing Backend API...
curl -s http://localhost:5000/api/market > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is running on port 5000
) else (
    echo [ERROR] Backend is not responding
    goto :END
)

echo.
echo 2. Testing Market Data...
curl -s http://localhost:5000/api/market | findstr /C:"success" > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Market API returning data
) else (
    echo [WARNING] Market API may have issues
)

echo.
echo 3. Checking Frontend...
curl -s http://localhost:5173 > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is running
) else (
    echo [INFO] Frontend may not be running - start with: npm run dev
)

echo.
echo ====================================
echo TEST COMPLETE
echo ====================================
echo.
echo To start servers:
echo   Backend:  cd backend ^&^& npm start
echo   Frontend: cd frontend ^&^& npm run dev
echo.

:END
pause
