# 🧪 Frontend-Backend Connection Test

## Quick Test Commands

### 1. Test Backend Health
```bash
curl https://tradex-384m.onrender.com/api/health
```
**Expected:** `{"success": true, "db": "connected"}`

### 2. Test Login API
```bash
curl -X POST https://tradex-384m.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@tradex.in","password":"Demo@123456"}'
```
**Expected:** JWT token + user data

### 3. Test Stocks API (No Auth)
```bash
curl https://tradex-384m.onrender.com/api/stocks?limit=5
```
**Expected:** Array of stock objects

---

## Browser Console Tests

After deploying frontend to Vercel, open browser console and run:

### Test 1: Check API URL
```javascript
// Should show: https://tradex-384m.onrender.com/api
console.log('API Base:', import.meta.env.VITE_API_URL);
```

### Test 2: Check Token Storage
```javascript
// After login, should show token
console.log('Token:', localStorage.getItem('accessToken'));
```

### Test 3: Check Authorization Header
```javascript
// Inspect network requests in DevTools
// Headers should include: Authorization: Bearer <token>
```

---

## Manual Testing Steps

### Step 1: Homepage
- [ ] Visit Vercel URL
- [ ] No console errors
- [ ] Navbar shows correctly
- [ ] Footer displays properly

### Step 2: Login
- [ ] Navigate to `/login`
- [ ] Enter credentials: `user@tradex.in` / `Demo@123456`
- [ ] Click "Login"
- [ ] Should redirect to `/dashboard`
- [ ] Token stored in localStorage (check DevTools → Application)

### Step 3: Dashboard
- [ ] Stocks load from backend
- [ ] Portfolio shows correct data
- [ ] Wallet balance displays
- [ ] Recent orders visible (if any)

### Step 4: Real-time Updates
- [ ] Open browser console
- [ ] Look for "Socket connected" message
- [ ] Watch stock prices update in real-time
- [ ] Check Network tab for WebSocket activity

### Step 5: KYC Flow
- [ ] Navigate to KYC page
- [ ] Fill personal details form
- [ ] Submit PAN information
- [ ] Upload documents (mock upload)
- [ ] Submit final KYC

### Step 6: Trading
- [ ] Select a stock from dashboard
- [ ] Place buy order
- [ ] Check orders page
- [ ] Verify portfolio updated

### Step 7: Admin Panel (Optional)
- [ ] Login as admin: `admin@tradex.in` / `Admin@123456`
- [ ] Access admin dashboard
- [ ] View users list
- [ ] Check KYC submissions
- [ ] Review wallet transactions

---

## Common Issues & Solutions

### Issue: Login fails with "Network Error"
**Cause:** Backend URL incorrect or CORS not configured  
**Solution:** 
1. Verify `VITE_API_URL=https://tradex-384m.onrender.com`
2. Add Vercel URL to Render's `FRONTEND_URL` env var

### Issue: Page shows but no data loads
**Cause:** API calls failing or token missing  
**Solution:**
1. Check browser console for errors
2. Verify token in localStorage
3. Check Network tab for 401 errors

### Issue: WebSocket not connecting
**Cause:** Socket.IO path incorrect  
**Solution:**
1. Verify SocketContext uses correct path
2. Check Render logs for socket connections

### Issue: Images/icons not loading
**Cause:** Asset paths incorrect  
**Solution:**
1. Check Vite build output
2. Verify asset manifest generated

---

## Performance Checks

### Load Time
- Homepage: < 2 seconds
- Dashboard: < 3 seconds
- Login: < 1 second

### API Response Time
- Health check: < 200ms
- Stock list: < 500ms
- Login: < 1 second

### WebSocket
- Connection time: < 1 second
- Message latency: < 100ms

---

## Security Verification

### Checklist
- [ ] All API calls use HTTPS
- [ ] Tokens stored securely (not in cookies)
- [ ] Authorization header on protected routes
- [ ] CORS only allows your domain
- [ ] Rate limiting active on auth routes
- [ ] No sensitive data in console logs

---

## Success Indicators

✅ **All systems working when:**
- Login successful and redirects
- Dashboard loads with real data
- Stock prices update in real-time
- Forms submit without errors
- Admin panel accessible
- No console errors
- Fast page transitions
- Smooth animations

---

## Debugging Tools

### Browser DevTools
- **Console:** Check for errors
- **Network:** Monitor API calls
- **Application:** View localStorage
- **Performance:** Measure load times

### React DevTools
- Inspect component tree
- Check props and state
- Debug hooks

### Redux DevTools (if needed)
- Track auth state changes
- Monitor API calls

---

## Rollback Plan

If production issues occur:

1. **Quick Fix:** Revert to localhost for testing
   ```bash
   # In frontend/.env
   VITE_API_URL=http://localhost:5000
   ```

2. **Debug Locally:** Test all features locally first

3. **Redeploy:** Push fixes and redeploy to Vercel

---

**🎯 Goal:** Ensure frontend seamlessly connects to live backend on Render!
