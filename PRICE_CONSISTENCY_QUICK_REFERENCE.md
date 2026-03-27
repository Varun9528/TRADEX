# ✅ PRICE CONSISTENCY - QUICK REFERENCE

## 🎯 SINGLE SOURCE OF TRUTH

**ONE price used everywhere:**

```javascript
const executedPrice = price 
  ? Number(price.toFixed(2))           // Frontend price
  : Number((stock.currentPrice || stock.price).toFixed(2));  // Fallback

const orderValue = Number((executedPrice * quantity).toFixed(2));
```

---

## 📊 PRICE FLOW EXAMPLE

### **BUY 1 RELIANCE @ 1433.22 (MIS)**

**Frontend Sends:**
```json
{
  "symbol": "RELIANCE",
  "price": 1433.22,
  "quantity": 1,
  "productType": "MIS"
}
```

**Backend Uses SAME Price:**
```
✅ executedPrice = 1433.22
✅ orderValue = 1433.22
✅ marginUsed = 286.64 (20%)
✅ walletDeduct = 286.64
✅ portfolioAvg = 1433.22
✅ transactionDesc = "Bought 1 RELIANCE @ ₹1433.22"
```

**Response Returns:**
```json
{
  "success": true,
  "data": {
    "executedPrice": 1433.22,
    "orderValue": 1433.22,
    "marginUsed": 286.64,
    "walletBalance": 99713.36
  }
}
```

---

## 🔧 KEY FIXES APPLIED

| Component | Before | After |
|-----------|--------|-------|
| **Order Price** | marketPrice | executedPrice ✅ |
| **Portfolio Avg** | marketPrice | executedPrice ✅ |
| **Transaction** | marketPrice | executedPrice ✅ |
| **Wallet Deduct** | Unrounded | Rounded to 2 decimals ✅ |
| **Margin Calc** | Inconsistent | Consistent ✅ |

---

## 📋 MARGIN CALCULATIONS

### **MIS (Intraday):**
```
Margin = Order Value × 0.20
Example: 1433.22 × 0.20 = 286.64
```

### **CNC (Delivery):**
```
Margin = Order Value × 1.00
Example: 1433.22 × 1.00 = 1433.22
```

---

## 🧪 TEST CHECKLIST

- [ ] BUY MIS: Wallet deducts 20%
- [ ] BUY CNC: Wallet deducts 100%
- [ ] SELL Profit: Wallet increases
- [ ] SELL Loss: Wallet decreases
- [ ] Portfolio shows correct avg price
- [ ] Transaction shows correct price
- [ ] Order history matches execution price
- [ ] All prices identical everywhere

---

## ⚠️ VERIFY IN DATABASE

### **Order Collection:**
```javascript
db.orders.findOne({}).sort({_id:-1})
// Should show: price = executedPrice = same value
```

### **Holding Collection:**
```javascript
db.holdings.findOne({symbol: 'RELIANCE'})
// Should show: avgBuyPrice = executedPrice
```

### **Transaction Collection:**
```javascript
db.transactions.findOne({}).sort({_id:-1})
// Description should mention executedPrice
```

---

## 🚀 RESTART BACKEND

```bash
Ctrl+C → cd backend → node server.js
```

---

## ✨ EXPECTED RESULT

### **Before Fix:**
```
Chart:      1433.22
Order:      1433.25 ❌
Portfolio:  1433.30 ❌
Wallet:     286.65  ❌
```

### **After Fix:**
```
Chart:      1433.22
Order:      1433.22 ✅
Portfolio:  1433.22 ✅
Wallet:     286.64  ✅
```

---

## 📝 FILES FIXED

- `backend/routes/trades.js` - Unified pricing
- `backend/routes/positions.js` - Consistent square off

---

**Status:** ✅ FIXED  
**Result:** Single source of truth pricing  

**Same price everywhere - no exceptions!** 🎯📈💰
