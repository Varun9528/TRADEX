# 🚀 Admin Wallet & Notification System - Quick Reference

## ✅ BACKEND COMPLETE - March 27, 2026

---

## 📁 FILES CREATED

```
✅ backend/models/Notification.js       (NEW - 88 lines)
✅ backend/routes/adminWallet.js        (NEW - 395 lines)
✅ backend/routes/adminUsers.js         (NEW - 151 lines)
✅ ADMIN_WALLET_NOTIFICATION_COMPLETE.md (Documentation)
✅ IMPLEMENTATION_SUMMARY_ADMIN_WALLET.md (Guide)
```

---

## 🔧 QUICK API REFERENCE

### Fund Requests
```bash
# User submits
POST /api/wallet/fund-request

# Admin views all
GET /api/admin/fund-requests

# Admin approves (adds funds to wallet)
POST /api/admin/approve-fund/:id

# Admin rejects
POST /api/admin/reject-fund/:id
```

### Withdrawal Requests
```bash
# User submits (blocks amount)
POST /api/wallet/withdraw-request

# Admin views all
GET /api/admin/withdraw-requests

# Admin approves (deducts funds)
POST /api/admin/approve-withdraw/:id

# Admin rejects (unblocks funds)
POST /api/admin/reject-withdraw/:id
```

### User Management
```bash
# Get all users (with search/filter)
GET /api/admin/users?search=john&tradingEnabled=true

# Toggle trading permission
PATCH /api/admin/toggle-trading/:userId
Body: { "enabled": false }
```

### Notifications
```bash
# Get all notifications
GET /api/notifications

# Get unread count (for bell icon)
GET /api/notifications/unread-count

# Mark as read
PATCH /api/notifications/:id/read

# Mark all as read
PATCH /api/notifications/read-all
```

---

## 🎯 TESTING EXAMPLES

### Test Fund Request Flow
```bash
# 1. User submits fund request
curl -X POST http://localhost:5000/api/wallet/fund-request \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "paymentMethod": "UPI",
    "upiId": "user@oksbi",
    "transactionReference": "TXN123456"
  }'

# 2. Admin views requests
curl -X GET http://localhost:5000/api/admin/fund-requests \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 3. Admin approves
curl -X POST http://localhost:5000/api/admin/approve-fund/REQUEST_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected: Wallet balance increases by 5000
```

### Test Trading Toggle
```bash
# Disable trading for user
curl -X PATCH http://localhost:5000/api/admin/toggle-trading/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Try to place order (should fail)
curl -X POST http://localhost:5000/api/trades/order \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "RELIANCE", "quantity": 10, "transactionType": "BUY"}'

# Expected response:
# {"success": false, "message": "Trading disabled by admin"}
```

---

## 📊 DATABASE SCHEMAS

### Notification
```javascript
{
  user: ObjectId,
  title: String,
  message: String,
  type: 'FUND_APPROVED' | 'WITHDRAW_APPROVED' | 'TRADING_ENABLED' | etc,
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
  isRead: Boolean,
  readAt: Date,
  metadata: Object
}
```

### FundRequest (Enhanced)
```javascript
{
  user: ObjectId,
  amount: Number,
  paymentMethod: 'UPI' | 'Bank Transfer' | 'QR Payment',
  upiId: String,           // NEW
  bankName: String,        // NEW
  accountNumber: String,   // NEW
  ifscCode: String,        // NEW
  transactionReference: String,
  status: 'pending' | 'approved' | 'rejected',
  approvedBy: ObjectId,
  approvedAt: Date
}
```

---

## 🎯 FRONTEND CHECKLIST

Create these components:

- [ ] `AdminFundRequests.jsx` - Table with approve/reject
- [ ] `AdminWithdrawRequests.jsx` - Similar to fund requests
- [ ] `AdminUsers.jsx` - User list with trading toggle
- [ ] `NotificationBell.jsx` - Badge with unread count
- [ ] `NotificationsPage.jsx` - Full notification history
- [ ] API functions in `api/index.js`

---

## ✅ SUCCESS CRITERIA

After frontend integration:

1. ✅ Fund requests visible in admin panel immediately
2. ✅ Admin approval updates wallet balance
3. ✅ Notifications sent automatically
4. ✅ Withdrawal requests work same way
5. ✅ Trading toggle enables/disables trading
6. ✅ Bell and notifications page synchronized
7. ✅ Data persists after refresh
8. ✅ No console errors
9. ✅ All data from database (no dummy data)

---

## 📝 CURRENT STATUS

| Component | Status |
|-----------|--------|
| Backend APIs | ✅ COMPLETE |
| Database Models | ✅ COMPLETE |
| Security | ✅ COMPLETE |
| Documentation | ✅ COMPLETE |
| Frontend | ⏳ PENDING |

---

## 🔗 DOCUMENTATION LINKS

- **Full Guide:** `ADMIN_WALLET_NOTIFICATION_COMPLETE.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY_ADMIN_WALLET.md`
- **This File:** `QUICK_REFERENCE_ADMIN_WALLET.md`

---

**🎉 BACKEND READY FOR FRONTEND INTEGRATION!**

For detailed instructions, see the full documentation files.
