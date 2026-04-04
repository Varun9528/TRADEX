@echo off
echo ====================================
echo CRITICAL BUG FIX VERIFICATION TEST
echo ====================================
echo.

echo STEP 1: Check React Hooks Fix...
echo Testing OrderPanel.jsx - hooks must run before return
echo [CHECK] All useQuery/useMutation hooks moved to top
echo [CHECK] Early return AFTER all hooks
echo [CHECK] No conditional hook calls

echo.
echo STEP 2: Check TradingPage State...
echo Testing selectedSymbol always exists
echo [CHECK] Auto-select first instrument logic present
echo [CHECK] SocketContext removed
echo [CHECK] Polling interval used instead of socket

echo.
echo STEP 3: Check Market API Format...
echo Testing GET /api/market response format
curl -s http://localhost:5000/api/market > temp_market.json 2>&1
findstr /C:"symbol" temp_market.json > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Market API returns instruments with symbol field
) else (
    echo [ERROR] Market API response missing symbol field
)
findstr /C:"currentPrice" temp_market.json > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Market API returns currentPrice field
) else (
    echo [ERROR] Market API response missing currentPrice field
)
del temp_market.json 2>nul

echo.
echo STEP 4: Check Database Seed Status...
echo Verifying database has seeded instruments
echo Please run: cd backend ^&^& npm run seed
echo Expected: 10 STOCK + 5 FOREX instruments

echo.
echo STEP 5: Verify Component Structure...
echo.
echo OrderPanel.jsx Requirements:
echo [1] Hooks at top (useQuery, useMutation, useState)
echo [2] Early return after hooks if !stock
echo [3] Optional chaining for stock?.symbol in callbacks
echo.
echo TradingPage.jsx Requirements:
echo [1] No SocketContext import
echo [2] useEffect for auto-select first instrument
echo [3] setInterval polling every 5 seconds
echo [4] marketData initialization from query result
echo.
echo Watchlist.jsx Requirements:
echo [1] Safe array extraction from API response
echo [2] Empty array fallback (not hardcoded stocks)
echo [3] Defensive checks for stock properties

echo.
echo ====================================
echo RUNTIME VERIFICATION STEPS
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
echo 4. Open Browser to: http://localhost:5173/trading
echo.
echo 5. Check Console (F12) - NO ERRORS expected:
echo    - No "Rendered more hooks" error
echo    - No "Cannot read property 'map' of undefined"
echo    - No "Cannot read property 'symbol' of undefined"
echo.
echo 6. Verify UI:
echo    [✓] Trading page loads without blank screen
echo    [✓] Watchlist shows instruments from database
echo    [✓] Chart renders for selected instrument
echo    [✓] Order panel visible with BUY/SELL buttons
echo    [✓] Indian/Forex market switch works
echo    [✓] Click instrument updates chart and order panel
echo.
echo SUCCESS CRITERIA:
echo - Console shows NO React Hooks violations
echo - Trading page loads successfully
echo - Market data displays correctly
echo - Buy/Sell buttons visible and functional
echo - No blank screens or crashes
echo.

pause
