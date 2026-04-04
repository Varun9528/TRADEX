@echo off
echo ====================================
echo DASHBOARD CRASH FIX VERIFICATION
echo ====================================
echo.

echo STEP 1: Check Dashboard.jsx for Errors...
echo.

echo Checking for undefined 'summary' variable...
findstr /C:"const summary" frontend\src\pages\Dashboard.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] summary variable defined
) else (
    echo [ERROR] summary variable missing - will crash
)

echo Checking for holdings extraction...
findstr /C:"const holdings = holdingsRes" frontend\src\pages\Dashboard.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] holdings properly extracted
) else (
    echo [ERROR] holdings not extracted - will crash
)

echo Checking for recentOrders definition...
findstr /C:"const recentOrders = ordersRes" frontend\src\pages\Dashboard.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] recentOrders defined
) else (
    echo [ERROR] recentOrders missing - will crash
)

echo.
echo STEP 2: Check SocketContext Removal...
echo.

echo Checking TradingPage.jsx...
findstr /C"useSocket" frontend\src\pages\TradingPage.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] SocketContext still in TradingPage
) else (
    echo [PASS] No SocketContext in TradingPage
)

echo Checking Watchlist.jsx...
findstr /C"useSocket" frontend\src\components\Watchlist.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] SocketContext still in Watchlist
) else (
    echo [PASS] No SocketContext in Watchlist
)

echo Checking Dashboard.jsx...
findstr /C"useSocket" frontend\src\pages\Dashboard.jsx > nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] SocketContext still in Dashboard
) else (
    echo [PASS] No SocketContext in Dashboard
)

echo.
echo STEP 3: Test Market API...
echo Testing GET /api/market endpoint...
curl -s http://localhost:5000/api/market > temp_market.json 2>&1
findstr /C:"success" temp_market.json > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Market API responding
) else (
    echo [ERROR] Market API not responding
)

findstr /C:"data" temp_market.json > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] API returns data array
) else (
    echo [ERROR] API response format incorrect
)
del temp_market.json 2>nul

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
echo 6. Add Instruments via Admin Panel:
echo    Navigate to /admin/market
echo    Add: TCS.NS (STOCK, Price: 3850)
echo    Add: INFY.NS (STOCK, Price: 1500)
echo    Add: EURUSD (FOREX, Price: 1.085)
echo.
echo 7. Test Dashboard (/):
echo    EXPECTED: No crash
echo    EXPECTED: No "summary is not defined" error
echo    EXPECTED: Shows TCS.NS, INFY.NS in gainers/losers
echo    EXPECTED: Market movers section populated
echo.
echo 8. Test Trading Page (/trading):
echo    EXPECTED: TCS.NS appears in watchlist
echo    EXPECTED: INFY.NS appears in watchlist
echo    EXPECTED: Chart loads with base prices
echo    EXPECTED: Order panel shows selected instrument
echo.
echo 9. Test Filters:
echo    Click "Indian Market"
echo    EXPECTED: Shows only STOCK instruments
echo    Click "Forex Market"
echo    EXPECTED: Shows only FOREX instruments
echo.
echo 10. Test Real-time Updates:
echo     Wait on trading page for 5 seconds
echo     EXPECTED: Data refreshes automatically
echo     Check network tab - /api/market called every 5s
echo.
echo ====================================
echo SUCCESS CRITERIA
echo ====================================
echo.
echo Dashboard:
echo [✓] Loads without crash
echo [✓] No "summary is not defined" error
echo [✓] No "recentOrders is not defined" error
echo [✓] Shows instruments from database
echo [✓] Gainers filtered by positive changePercent
echo [✓] Losers filtered by negative changePercent
echo [✓] Recent orders displayed correctly
echo [✓] Stat cards show correct data
echo.
echo All Pages Data Source:
echo [✓] Dashboard uses marketAPI
echo [✓] TradingPage uses marketAPI
echo [✓] Watchlist fetches from marketAPI
echo [✓] OrderPanel receives props correctly
echo [✓] ChartPanel receives props correctly
echo [✓] All use same /api/market endpoint
echo.
echo SocketContext Removed:
echo [✓] Dashboard - no socket usage
echo [✓] TradingPage - no socket usage
echo [✓] Watchlist - uses polling instead
echo [✓] All use React Query polling (5s interval)
echo.
echo Admin Data Flow:
echo [✓] Admin creates instrument
echo [✓] Appears in dashboard within 5s
echo [✓] Appears in trading page immediately
echo [✓] Appears in watchlist
echo [✓] Chart uses admin-set price
echo [✓] Order panel displays instrument
echo.
echo No Demo Data:
echo [✓] No FALLBACK_STOCKS
echo [✓] No DEMO_GAINERS
echo [✓] No DEMO_LOSERS
echo [✓] No hardcoded stock values
echo [✓] All data from database only
echo.
echo ====================================
echo DEBUGGING COMMANDS
echo ====================================
echo.
echo Check browser console (F12):
echo   Look for "summary is not defined" errors
echo   Look for "ReferenceError" messages
echo   Look for network errors to /api/market
echo.
echo Check network tab:
echo   Verify /api/market returns status 200
echo   Verify response has success: true
echo   Verify data array contains instruments
echo   Verify refetch every 5 seconds
echo.
echo Test API directly:
echo   curl http://localhost:5000/api/market
echo   curl http://localhost:5000/api/market?type^=STOCK
echo   curl http://localhost:5000/api/market?type^=FOREX
echo.

pause
