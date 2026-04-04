@echo off
echo ====================================
echo MARKET DATA CONNECTION VERIFICATION
echo ====================================
echo.

echo STEP 1: Test Market API Endpoint...
echo Testing GET /api/market...
curl -s http://localhost:5000/api/market > temp_market.json 2>&1
findstr /C:"success" temp_market.json > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Market API responding
) else (
    echo [ERROR] Market API not responding
)

echo Checking response format...
findstr /C:"data" temp_market.json > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] API returns data array
) else (
    echo [ERROR] API response format incorrect
)
del temp_market.json 2>nul

echo.
echo STEP 2: Check Frontend Files for Demo Data...
echo.

echo Checking Dashboard.jsx...
findstr /C:"stockAPI.getAll" frontend\src\pages\Dashboard.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] Dashboard still using old stockAPI
) else (
    echo [OK] Dashboard using marketAPI
)

findstr /C:"marketAPI" frontend\src\pages\Dashboard.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Dashboard imports marketAPI
) else (
    echo [ERROR] Dashboard missing marketAPI import
)

echo.
echo Checking TradingPage.jsx...
findstr /C:"marketAPI.getByType" frontend\src\pages\TradingPage.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] TradingPage using marketAPI
) else (
    echo [ERROR] TradingPage not using marketAPI
)

echo.
echo Checking Watchlist.jsx...
findstr /C:"FALLBACK_STOCKS" frontend\src\components\Watchlist.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [FAIL] Watchlist still has FALLBACK_STOCKS
) else (
    echo [PASS] Watchlist no fallback data
)

echo.
echo STEP 3: Verify Database Has Instruments...
echo Run this command to check:
echo   curl http://localhost:5000/api/market
echo.
echo Expected response:
echo {
echo   "success": true,
echo   "data": [ ... instruments ... ],
echo   "count": X
echo }

echo.
echo ====================================
echo MANUAL TESTING STEPS
echo ====================================
echo.
echo 1. Start Backend:
echo    cd backend
echo    npm start
echo.
echo 2. Seed Database (if needed):
echo    cd backend
echo    npm run seed
echo.
echo 3. Start Frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open Browser to: http://localhost:5173/
echo.
echo 5. Login as Admin:
echo    Email: admin@tradex.in
echo    Password: Admin@123456
echo.
echo 6. Go to Admin Panel (/admin/market):
echo    Add instrument:
echo    Symbol: TCS.NS
echo    Name: Tata Consultancy Services
echo    Type: STOCK
echo    Exchange: NSE
echo    Price: 3850
echo    Click Create Instrument
echo.
echo 7. Navigate to Dashboard (/):
echo    EXPECTED: Shows market instruments from DB
echo    EXPECTED: No old demo stocks
echo    EXPECTED: Gainers/Losers from DB only
echo.
echo 8. Navigate to Trading Page (/trading):
echo    EXPECTED: TCS.NS appears in watchlist
echo    EXPECTED: Chart loads with base price 3850
echo    EXPECTED: Order panel shows TCS.NS
echo    EXPECTED: No "Go to admin panel" message
echo.
echo 9. Test Indian Market Filter:
echo    Click "Indian Market" button
echo    EXPECTED: Shows only STOCK type instruments
echo.
echo 10. Add Forex Instrument:
echo     Go to /admin/market
echo     Add: EURUSD, Type: FOREX
echo     Return to /trading
echo     Click "Forex Market"
echo     EXPECTED: Shows only FOREX type
echo.
echo 11. Verify Real-time Updates:
echo     Wait 5 seconds on trading page
echo     EXPECTED: Data refreshes automatically
echo     Check network tab - /api/market called every 5s
echo.
echo 12. Test Order Panel Connection:
echo     Click on TCS.NS in watchlist
echo     EXPECTED: Chart updates to TCS.NS
echo     EXPECTED: Order panel shows TCS.NS symbol
echo     EXPECTED: Price displays correctly
echo.
echo ====================================
echo SUCCESS CRITERIA
echo ====================================
echo.
echo Data Flow:
echo [✓] All pages call GET /api/market
echo [✓] Response comes from MarketInstrument collection
echo [✓] No hardcoded demo data anywhere
echo [✓] Real-time updates every 5 seconds
echo.
echo Dashboard:
echo [✓] Shows DB instruments only
echo [✓] Gainers filtered by positive changePercent
echo [✓] Losers filtered by negative changePercent
echo [✓] No old static gainers/losers
echo.
echo Trading Page:
echo [✓] Watchlist shows DB instruments
echo [✓] Auto-selects first instrument if exists
echo [✓] Empty state only when truly empty
echo [✓] Indian/Forex filter works correctly
echo.
echo Watchlist:
echo [✓] Loads from API only
echo [✓] No FALLBACK_STOCKS constant
echo [✓] Updates when admin adds instrument
echo [✓] Click updates chart and order panel
echo.
echo Order Panel:
echo [✓] Receives selectedInstrument from parent
echo [✓] Displays correct symbol details
echo [✓] Uses admin-set base price
echo.
echo Chart Panel:
echo [✓] Works with any instrument from DB
echo [✓] Uses selectedSymbol prop
echo [✓] Simulates candles from admin price
echo.
echo Portfolio Page:
echo [✓] Fetches holdings from tradeAPI
echo [✓] Shows user's positions only
echo [✓] No demo holdings
echo.
echo ====================================
echo DEBUGGING COMMANDS
echo ====================================
echo.
echo Test API directly:
echo   curl http://localhost:5000/api/market?type^=STOCK
echo   curl http://localhost:5000/api/market?type^=FOREX
echo.
echo Check browser console (F12):
echo   Look for [Dashboard] Market API failed errors
echo   Look for [TradingPage] Market API failed errors
echo   Look for [Watchlist] Error fetching market errors
echo.
echo Check network tab:
echo   Verify /api/market returns status 200
echo   Verify response has success: true
echo   Verify data array contains instruments
echo.

pause
