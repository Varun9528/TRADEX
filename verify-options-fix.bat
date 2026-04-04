@echo off
echo.
echo ========================================
echo OPTIONS FILTER FIX VERIFICATION
echo ========================================
echo.

echo [1/4] Checking Backend Server...
curl -s http://localhost:5000/api/market?type=OPTION^&limit=1 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend server is running
) else (
    echo ✗ Backend server is NOT running
    echo   Run: cd backend ^&^& npm run dev
    goto :end
)

echo.
echo [2/4] Testing API with type=OPTION (uppercase)...
curl -s "http://localhost:5000/api/market?type=OPTION&limit=1000" > %TEMP%\options_test.json
python -c "import json; data=json.load(open(r'%TEMP%\options_test.json')); print(f'  Success: {data[\"success\"]}'); print(f'  Count: {data[\"count\"]} options')"

echo.
echo [3/4] Testing API with type=option (lowercase - case insensitive fix)...
curl -s "http://localhost:5000/api/market?type=option&limit=1000" > %TEMP%\options_test2.json
python -c "import json; data=json.load(open(r'%TEMP%\options_test2.json')); print(f'  Success: {data[\"success\"]}'); print(f'  Count: {data[\"count\"]} options')"

echo.
echo [4/4] Verifying Database...
cd backend
node utils/verifyOptionsFix.js 2>nul | findstr /C:"Active OPTION" /C:"SUCCESS"
cd ..

echo.
echo ========================================
echo VERIFICATION COMPLETE
echo ========================================
echo.
echo Next Steps:
echo 1. Open Admin Panel → Market Management → Options Manager
echo 2. Verify 328 options are displayed
echo 3. Open Trading Page → Click "Options" tab
echo 4. Verify options appear in watchlist
echo.

:end
pause
