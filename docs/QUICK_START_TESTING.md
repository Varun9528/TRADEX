# Quick Start Guide - TwelveData Trading Platform 🚀

## Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Verify Configuration
Check `backend/.env` has TwelveData API key:
```env
TWELVEDATA_API_KEY=4d0bed62527a47e995728f7a7160e31e
TWELVEDATA_BASE_URL=https://api.twelvedata.com
```

### Step 3: Start Backend Server
```bash
cd backend
npm run dev
```

You should see:
```
[PriceUpdateJob] Initializing price update job
[PriceUpdateJob] Price updates scheduled every 5 seconds
TradeX API running on port 5000 [development]
```

### Step 4: Start Frontend Server
```bash
cd frontend
npm run dev
```

Open browser to: `http://localhost:5173`

---

## Testing Checklist

### ✅ Test 1: Real-Time Prices (Watchlist)
1. Navigate to `/trading`
2. Look at the watchlist on the left
3. **Expected**: Prices should update every 5 seconds
4. **Check**: Browser console should show Socket.IO connection

**What you'll see:**
- Stocks list with live prices
- Green/red arrows indicating price movement
- Percentage changes updating in real-time

---

### ✅ Test 2: Candlestick Chart
1. Click on any stock in watchlist (e.g., RELIANCE.NS)
2. Chart should load in the center
3. Try different time intervals: 1m, 5m, 15m, 1h, 1D

**Expected:**
- Real historical candles from TwelveData
- Last candle updating with current price
- Smooth chart rendering

**If chart doesn't load:**
- Check Network tab for `/api/stocks/candles` requests
- Should return array of candle objects
- Fallback mock data will show if API fails

---

### ✅ Test 3: Place BUY Order
1. Select a stock (e.g., TCS.NS)
2. In Order Panel (right side):
   - Quantity: 10
   - Product Type: MIS (Intraday) or CNC (Delivery)
   - Order Type: Market
3. Click "Place BUY Order"

**Expected Result:**
- Toast notification: "BUY order executed for TCS.NS"
- Wallet balance decreases
- Position created in database
- Order saved in database

**Verify:**
```javascript
// Check console logs
[OrderPanel] Placing order with data: {...}
[OrderPanel] Order success response: {...}
```

---

### ✅ Test 4: Place SELL Order
1. After buying, try selling same stock
2. Select SELL tab in Order Panel
3. Enter quantity to sell
4. Click "Place SELL Order"

**Expected Result:**
- P&L calculated: `(current_price - avg_buy_price) × quantity`
- Wallet balance increases by P&L
- Position quantity decreases
- If position closes, P&L added to wallet

**Example:**
```
Buy: 10 shares @ ₹2500 = ₹25,000
Sell: 10 shares @ ₹2550 = ₹25,500
Profit: ₹500 (added to wallet)
```

---

### ✅ Test 5: Admin Trading Control
1. Login as admin (email: `admin@tradex.in`, password: `Admin@123456`)
2. Go to `/admin/users`
3. Find a user and toggle the "Trading" switch OFF
4. Logout and login as that user
5. Try placing an order

**Expected:**
- Error message: "Trading not enabled by admin"
- Order button disabled
- User cannot trade

---

### ✅ Test 6: Real-Time Updates
1. Open trading page in TWO different browsers
2. Both should show same prices initially
3. Wait 5 seconds
4. Both should update simultaneously

**Expected:**
- Prices sync across all connected clients
- Socket.IO broadcasts working correctly

---

## Common Issues & Solutions

### ❌ Issue: "Insufficient funds" error
**Solution:** Add funds to wallet first
- Go to `/wallet` page
- Click "Add Funds"
- Enter amount (min ₹100)
- Submit fund request (admin will approve)

OR use admin panel to directly add funds:
1. Login as admin
2. Go to `/admin/wallet`
3. Select user
4. Enter amount
5. Click "Add to Wallet"

---

### ❌ Issue: Chart shows blank screen
**Solution:** 
1. Check Network tab for failed requests
2. Verify TwelveData API is responding
3. Mock data should load as fallback
4. Restart backend server if needed

---

### ❌ Issue: Prices not updating
**Solution:**
1. Check backend console for `[PriceUpdateJob]` logs
2. Verify Socket.IO connection in browser console
3. Check if background job is running every 5 seconds
4. Restart backend server

---

### ❌ Issue: KYC not approved
**Solution:**
1. Complete KYC submission:
   - Go to `/kyc`
   - Fill personal details
   - Upload PAN card
   - Upload Aadhaar card
   - Upload selfie
   - Submit
2. Admin approval:
   - Login as admin
   - Go to `/admin/kyc`
   - Click checkmark ✓ to approve

---

## Default Test Data

### Pre-configured Stocks (NSE)
```
RELIANCE.NS    - Reliance Industries
TCS.NS         - Tata Consultancy Services
INFY.NS        - Infosys Limited
HDFCBANK.NS    - HDFC Bank
ICICIBANK.NS   - ICICI Bank
SBIN.NS        - State Bank of India
LT.NS          - Larsen & Toubro
ITC.NS         - ITC Limited
KOTAKBANK.NS   - Kotak Mahindra Bank
AXISBANK.NS    - Axis Bank
```

### Test User Credentials
```
Email: user@example.com
Password: User@123456

Email: test@tradex.in
Password: Test@123456
```

### Admin Credentials
```
Email: admin@tradex.in
Password: Admin@123456
```

---

## API Endpoints to Test

### Market Data
```bash
# Get real-time price
GET http://localhost:5000/api/stocks/live-price/RELIANCE.NS

# Get historical candles
GET http://localhost:5000/api/stocks/candles/RELIANCE.NS?interval=1min&outputsize=50

# Get detailed quote
GET http://localhost:5000/api/stocks/quote/RELIANCE.NS
```

### Trading
```bash
# Place order (requires auth token)
POST http://localhost:5000/api/trades/order
{
  "symbol": "RELIANCE.NS",
  "quantity": 10,
  "productType": "MIS",
  "transactionType": "BUY"
}

# Get user orders
GET http://localhost:5000/api/trades/orders
```

### Admin
```bash
# Toggle trading enabled
PATCH http://localhost:5000/api/admin/users/:userId/trading
{
  "tradingEnabled": false
}

# Admin place trade
POST http://localhost:5000/api/admin/trade
{
  "userId": "...",
  "symbol": "RELIANCE.NS",
  "quantity": 10,
  "transactionType": "BUY"
}
```

---

## Performance Benchmarks

### Expected Timings
- Page load: < 2 seconds
- Chart load: < 3 seconds
- Price update: Every 5 seconds
- Order execution: < 1 second
- Socket latency: < 100ms

### Rate Limits
- TwelveData API: 8 calls/minute (free tier)
- Our caching: 5-second cache TTL
- Background job: Updates every 5 seconds

---

## Success Indicators ✅

When everything is working correctly, you should see:

1. ✅ Watchlist showing live prices
2. ✅ Chart displaying candlesticks
3. ✅ Orders executing successfully
4. ✅ Wallet balance updating
5. ✅ Positions tracking P&L
6. ✅ Admin controls working
7. ✅ Mobile responsive layout
8. ✅ No console errors
9. ✅ Smooth animations
10. ✅ Real-time sync across tabs

---

## Next Steps After Testing

1. **Complete Your Profile**
   - Update personal information
   - Complete KYC verification
   - Enable trading

2. **Add Funds**
   - Request fund addition
   - Wait for admin approval
   - Start trading

3. **Practice Trading**
   - Start with small quantities
   - Use MIS for intraday (less margin)
   - Use CNC for delivery (full amount)
   - Monitor P&L in real-time

4. **Explore Features**
   - Check order history
   - View positions
   - Analyze chart patterns
   - Set price alerts

---

## Need Help?

### Debugging Tips
1. **Backend logs**: Check `backend/logs/error.log`
2. **Frontend console**: Open browser DevTools (F12)
3. **Network requests**: Check Network tab for failed requests
4. **Socket status**: Type `socket.connected` in browser console

### Useful Commands
```bash
# Check backend status
tail -f backend/logs/error.log

# Check MongoDB connection
mongo --eval "db.stats()"

# Restart backend
Ctrl+C && npm run dev

# Clear frontend cache
rm -rf node_modules/.vite && npm run dev
```

---

**Happy Trading! 📈🚀**
