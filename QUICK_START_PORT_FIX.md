# 🚀 QUICK START - Port Fix Applied

## ✅ What Was Fixed
- **Frontend .env**: Changed from port 5001 → **5000**
- **Backend server.js**: Removed dynamic port fallback → **Fixed on 5000**
- **Axios config**: Already correct → **No changes needed**

---

## 🎯 Quick Start (3 Steps)

### Step 1: Restart Everything
```bash
c:\xampp\htdocs\tradex\restart-servers.bat
```

### Step 2: Wait 5 Seconds
Let both servers fully start up.

### Step 3: Open Browser
```
http://localhost:5173
```

---

## ✅ Verification (Quick Tests)

### Test 1: Backend Running
```bash
curl http://localhost:5000/api/market
```
✅ Should return JSON with instruments

### Test 2: Login Works
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"your@email.com\",\"password\":\"yourpass\"}"
```
✅ Should return token or "Invalid credentials" (not connection error)

### Test 3: Frontend Loads
Open: `http://localhost:5173`
✅ No blank screen
✅ Login page visible
✅ Can attempt login

---

## 🔧 If Something's Wrong

### Port Still in Use?
```bash
taskkill /F /IM node.exe
```
Then restart servers.

### Need to Check Configuration?
```bash
# Backend port (should be 5000)
grep "PORT" backend/.env

# Frontend URL (should be localhost:5000)
cat frontend/.env
```

---

## 📊 Ports Summary

| What | Port | Status |
|------|------|--------|
| Backend API | 5000 | ✅ Fixed |
| Frontend Dev | 5173 | ✅ Auto |
| Database | MongoDB Atlas | ✅ Connected |

---

## ⚡ One-Liner Restart
```bash
taskkill /F /IM node.exe && cd c:\xampp\htdocs\tradex\backend && npm start
```
(Then open new terminal and run frontend)

---

**Status:** ✅ READY TO USE  
**Last Updated:** 2026-03-27
