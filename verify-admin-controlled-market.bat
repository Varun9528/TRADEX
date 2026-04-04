@echo off
echo ====================================
echo ADMIN CONTROLLED MARKET VERIFICATION
echo ====================================
echo.

echo STEP 1: Check NO FALLBACK DATA in Code...
echo.

echo Checking Watchlist.jsx...
findstr /C:"FALLBACK_STOCKS" frontend\src\components\Watchlist.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [FAIL] FALLBACK_STOCKS constant still exists
) else (
    echo [PASS] No FALLBACK_STOCKS constant found
)

echo.
echo Checking market.js route...
findstr /C:"fallback data" backend\routes\market.js > nul 2>&1
if %errorlevel% equ 0 (
    echo [FAIL] Fallback data still in API
) else (
    echo [PASS] No fallback data in API
)

echo.
echo STEP 2: Test Market API Response...
echo Testing GET /api/market endpoint...
curl -s http://localhost:5000/api/market > temp_market.json 2>&1
findstr /C:"No instruments available" temp_market.json > nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] API returns admin message correctly
) else (
    echo [INFO] API may have instruments or error
)
del temp_market.json 2>nul

echo.
echo STEP 3: Verify Database Seed Status...
echo Run this command to check database:
echo   cd backend
echo   npm run seed
echo.
echo Expected: Seeder creates instruments ONLY if run manually

echo.
echo ====================================
echo MANUAL TESTING STEPS
echo ====================================
echo.
echo 1. Start Backend:
echo    cd backend
echo    npm start
echo.
echo 2. Start Frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 3. Open Browser to: http://localhost:5173/trading
echo.
echo EXPECTED BEHAVIOR:
echo [✓] If no instruments in DB: Shows "No Instruments Available"
echo [✓] Message: "Admin must add market instruments"
echo [✓] Button: "Go to Admin Panel"
echo.
echo 4. Login as Admin:
echo    Email: admin@tradex.in
echo    Password: Admin@123456
echo.
echo 5. Go to Admin Panel:
echo    Navigate to: /admin/market
echo.
echo 6. Add Instrument Example:
echo    Symbol: RELIANCE.NS
echo    Name: Reliance Industries
echo    Type: STOCK
echo    Exchange: NSE
echo    Price: 2450.00
echo    Open: 2440.00
echo    High: 2470.00
echo    Low: 2430.00
echo    Close: 2445.00
echo    Volume: 1000000
echo    Click: Create Instrument
echo.
echo 7. Add Forex Example:
echo    Symbol: EURUSD
echo    Name: Euro / US Dollar
echo    Type: FOREX
echo    Exchange: FOREX
echo    Price: 1.0850
echo    Open: 1.0840
echo    High: 1.0870
echo    Low: 1.0830
echo    Close: 1.0845
echo    Volume: 5000000
echo    Click: Create Instrument
echo.
echo 8. Return to Trading Page:
echo    Navigate to: /trading
echo.
echo EXPECTED RESULT:
echo [✓] RELIANCE.NS appears in watchlist
echo [✓] EURUSD appears in watchlist
echo [✓] Chart loads for first instrument
echo [✓] Order panel visible
echo [✓] Indian Market button shows STOCK instruments
echo [✓] Forex Market button shows FOREX instruments
echo.
echo 9. Test Admin Edit:
echo    Go back to /admin/market
echo    Click Edit on RELIANCE.NS
echo    Change price from 2450 to 2500
echo    Save changes
echo.
echo 10. Return to Trading Page:
echo     Navigate to /trading
echo     Check watchlist price updated to 2500
echo     Chart should use new base price
echo.
echo 11. Test Admin Delete:
echo     Go to /admin/market
echo     Click Delete on EURUSD
echo     Confirm deletion
echo.
echo 12. Return to Trading Page:
echo     Navigate to /trading
echo     Select "Forex Market" filter
echo     EURUSD should NOT appear
echo.
echo ====================================
echo SUCCESS CRITERIA
echo ====================================
echo.
echo [✓] No default instruments appear without seeding
echo [✓] Empty state shown when no instruments
echo [✓] Admin can create instruments
echo [✓] Instruments appear immediately on trading page
echo [✓] Admin can edit prices
echo [✓] Price updates reflect on chart
echo [✓] Admin can delete instruments
echo [✓] Deleted instruments removed from trading page
echo [✓] Indian Market filter works (type=STOCK)
echo [✓] Forex Market filter works (type=FOREX)
echo [✓] No hardcoded stocks in code
echo [✓] No demo data anywhere
echo.
echo ====================================
echo VERIFICATION COMMAND
echo ====================================
echo.
echo After adding instruments, test API:
echo curl http://localhost:5000/api/market?type^=STOCK
echo curl http://localhost:5000/api/market?type^=FOREX
echo.

pause
