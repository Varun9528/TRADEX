# Trading System - Quick Reference Card

## 🚀 QUICK START

### 1. Admin Adds Funds
```javascript
// API: POST /api/wallet/add-funds
{
  "userId": "user123",
  "amount": 50000
}

// Result: User wallet balance increases
```

### 2. User Buys Stock
```javascript
// API: POST /trades/order
{
  "symbol": "RELIANCE",
  "transactionType": "BUY",
  "quantity": 10,
  "productType": "CNC"
}

// Result: 
// - Wallet deducts amount
// - Portfolio adds shares
// - Average price calculated
```

### 3. User Sells Stock
```javascript
// API: POST /trades/order
{
  "symbol": "RELIANCE",
  "transactionType": "SELL",
  "quantity": 10
}

// Result:
// - Wallet adds sell value + P&L
// - Portfolio removes shares
// - Profit/loss realized
```

---

## 🔑 KEY ENDPOINTS

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/add-funds` - Admin adds funds

### Trades
- `POST /api/trades/order` - Place order (BUY/SELL)
- `GET /api/trades/portfolio` - Get portfolio
- `GET /api/trades/orders` - Order history

### Admin
- `PATCH /api/admin/users/:id/trading` - Toggle trading

---

## 💰 FORMULAS

### Buy Order
```javascript
orderValue = quantity * marketPrice
requiredMargin = productType === 'MIS' ? orderValue * 0.2 : orderValue

// Update holding average price
avgPrice = ((oldQty * oldPrice) + (newQty * newPrice)) / totalQty
```

### Sell Order
```javascript
sellValue = quantity * marketPrice
pnl = (marketPrice - avgBuyPrice) * quantity

// Wallet update
walletBalance += pnl  // Add profit/loss
availableBalance += sellValue  // Return full amount
```

### Portfolio P&L
```javascript
currentValue = quantity * currentPrice
pnl = currentValue - totalInvested
pnlPercent = ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100
```

---

## ✅ VALIDATIONS

```javascript
✓ Prevent negative balance
✓ Prevent selling more than owned
✓ Prevent trading if disabled by admin
✓ Prevent zero/negative quantity
✓ Require KYC approval
```

---

## 📊 CHART SETTINGS

```javascript
{
  barSpacing: 6,              // Candle spacing
  precision: 2,               // Decimal places
  timeVisible: true,          // Show time
  secondsVisible: false,      // Hide seconds
  rightBarStaysOnScroll: true,
  handleScroll: true,
  handleScale: true,
}
```

---

## ⚡ REAL-TIME UPDATES

- **Frequency:** Every 3 seconds
- **Updates:** Chart, Watchlist, Portfolio
- **Method:** WebSocket (`socket.on('price:update')`)

---

## 🎯 EXAMPLE FLOW

```
1. Admin adds ₹50,000 → User wallet
2. User buys 10 RELIANCE @ ₹2,847.50
   - Wallet: ₹50,000 → ₹21,525
   - Portfolio: +10 shares
3. Price rises to ₹2,895.20
   - Unrealized P&L: +₹477
4. User sells 10 RELIANCE @ ₹2,895.20
   - Wallet: ₹21,525 + ₹28,952 + ₹477 = ₹50,954
   - Portfolio: 0 shares
   - Realized P&L: +₹477
```

---

## 🔧 ERROR MESSAGES

| Error | Cause |
|-------|-------|
| "Insufficient balance" | Wallet < order amount |
| "Insufficient position" | Trying to sell more than owned |
| "Trading disabled by admin" | `tradingEnabled: false` |
| "KYC not approved" | KYC status ≠ approved |
| "Invalid quantity" | Quantity ≤ 0 |

---

## 📁 KEY FILES

### Backend
- `routes/wallet.js` - Wallet management
- `routes/trades.js` - Order processing
- `models/User.js` - User schema with wallet
- `models/Order.js` - Order & Holding models

### Frontend
- `api/index.js` - API methods
- `components/OrderPanel.jsx` - Trading UI
- `pages/PortfolioPage.jsx` - Holdings display
- `pages/OrdersPage.jsx` - Order history

---

## 🎨 UI STATES

### Order Panel
```javascript
BUY Button: enabled if (kyc === 'approved' && tradingEnabled)
SELL Button: enabled if (kyc === 'approved' && tradingEnabled && hasPosition)

Shows:
- Available balance
- Required margin
- Est. amount
```

### Portfolio Page
```javascript
Displays:
- Symbol, Name, Sector
- Quantity
- Avg Buy Price
- Current Price
- P&L (absolute + %)
- Real-time updates every 3s
```

---

## 🔐 ADMIN CONTROLS

### Toggle Trading
```javascript
// PATCH /api/admin/users/:id/trading
{
  "tradingEnabled": true  // or false
}

// User sees:
if (!tradingEnabled) {
  show: "Trading disabled by admin"
  disable: BUY/SELL buttons
}
```

---

## 📈 PORTFOLIO STRUCTURE

```javascript
{
  symbol: "RELIANCE",
  name: "Reliance Industries Ltd",
  sector: "Energy",
  logo: "📊",
  quantity: 10,
  avgBuyPrice: 2847.50,
  totalInvested: 28475.00,
  currentPrice: 2895.20,
  currentValue: 28952.00,
  pnl: 477.00,
  pnlPercent: 1.68,
  productType: "DELIVERY",
  firstBuyDate: "2024-01-15",
  lastBuyDate: "2024-01-20"
}
```

---

## 🎯 TESTING CHECKLIST

- [ ] Admin can add funds
- [ ] User can buy stock
- [ ] Wallet deducts correctly
- [ ] Portfolio shows holdings
- [ ] Average price calculates correctly
- [ ] User can sell stock
- [ ] P&L calculates correctly
- [ ] Wallet updates on sell
- [ ] Insufficient balance error works
- [ ] Insufficient position error works
- [ ] Trading toggle works
- [ ] Chart updates every 3s
- [ ] Order history displays correctly

---

## 🚨 COMMON ISSUES

### Issue: Balance not updating
**Solution:** Check walletAPI call and query invalidation

### Issue: Average price wrong
**Solution:** Verify formula: `((oldQty * oldPrice) + (newQty * newPrice)) / totalQty`

### Issue: P&L not showing
**Solution:** Check if `currentPrice` is being updated via WebSocket

### Issue: Buttons disabled
**Solution:** Verify `user.kycStatus === 'approved'` and `user.tradingEnabled`

---

## 📞 SUPPORT

For issues or questions:
- Check logs: `backend/logs/`
- Debug mode: `console.log()` statements in routes
- Test APIs: Postman collection available
- Documentation: See main implementation guide

---

**Status:** ✅ COMPLETE  
**Last Updated:** Current session  
**Version:** 1.0  
