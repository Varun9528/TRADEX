# Render Deployment Checklist ✅

## Pre-Deployment Verification

### 1. Backend Configuration
- [x] `server.js` uses `process.env.PORT` ✅
- [x] MongoDB Atlas URI configured in environment variables ✅
- [x] Start command: `npm start` ✅
- [x] CORS configured for multiple origins ✅
- [x] Production-ready error handling ✅
- [x] Static file serving for frontend ✅

### 2. Environment Variables Required on Render

**Copy these from `backend/.env.render`:**

```bash
# Required
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://varuntirole210:Varun%4007067@worksuperfast.2ra3pek.mongodb.net/tradex_india?retryWrites=true&w=majority&appName=worksuperfast
JWT_SECRET=386c1494d316c643c55d0dd2a8bc0710fb27b747ffaa4f85880792a671fd926f
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=dd846cdf779d43a3dd602c92f5ecc590e3abc0cd807217fa1ff56c50b371d355
JWT_REFRESH_EXPIRE=30d

# Optional (Email notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=TradeX India <noreply@tradex.in>

# Admin credentials
ADMIN_EMAIL=admin@tradex.in
ADMIN_PASSWORD=Admin@123456

# Add after frontend deployment
# FRONTEND_URL=https://your-app.vercel.app
```

### 3. MongoDB Atlas Configuration
- [x] Database cluster created ✅
- [x] Connection string obtained ✅
- [x] Network access allows all IPs (0.0.0.0/0) ⚠️ **Verify this!**
- [x] Database user has read/write permissions ✅
- [x] Demo data seeded (users, stocks, etc.) ✅

### 4. Git Repository
- [ ] Code pushed to GitHub/GitLab
- [ ] `.env` file in `.gitignore` ✅
- [ ] `backend/.env.render` available for reference ✅
- [ ] README.md updated with deployment info ✅

---

## Render Deployment Steps

### Step-by-Step Guide

#### 1. Create Render Account
- [ ] Go to https://render.com
- [ ] Sign up with GitHub account
- [ ] Verify email

#### 2. Create Web Service
- [ ] Click "New +" → "Web Service"
- [ ] Connect your repository
- [ ] Select repository: `tradex`

#### 3. Configure Service
- [ ] **Name:** `tradex-backend` (or custom name)
- [ ] **Region:** Choose closest to users (e.g., Oregon, Singapore)
- [ ] **Branch:** `main` (or your default branch)
- [ ] **Root Directory:** `backend` ⚠️ **Important!**
- [ ] **Runtime:** `Node`
- [ ] **Build Command:** `npm install`
- [ ] **Start Command:** `npm start`

#### 4. Select Instance Type
- [ ] **Free Tier:** Free (750 hours/month, auto-sleep)
- [ ] **Starter:** $7/month (no sleep, better performance)
- [ ] Click "Continue"

#### 5. Add Environment Variables
- [ ] Click "Advanced" → "Add Environment Variable"
- [ ] Add each variable from `.env.render` file
- [ ] Double-check MONGODB_URI (full connection string)
- [ ] Verify JWT_SECRET (64 characters)
- [ ] Click "Add" for each variable

#### 6. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build (~2-5 minutes)
- [ ] Check deployment logs for errors
- [ ] Copy public URL when deployed

---

## Post-Deployment Verification

### Immediate Tests (Within 5 minutes of deploy)

#### 1. Health Check
```bash
curl https://tradex-backend.onrender.com/api/health
```
Expected:
```json
{
  "success": true,
  "message": "TradeX India API is running",
  "db": "connected"
}
```

#### 2. Test Public APIs (No Auth Required)
```bash
# Get stocks list
curl https://tradex-backend.onrender.com/api/stocks?limit=5
```
Expected: Array of stock objects

#### 3. Test Authentication
```bash
# Login with demo account
curl -X POST https://tradex-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@tradex.in","password":"Demo@123456"}'
```
Expected: JWT token + user data

#### 4. Check Logs
- [ ] Go to Render Dashboard → Your service → Logs tab
- [ ] Look for "MongoDB connected" message
- [ ] No ERROR or WARN messages
- [ ] Request logs showing 200 responses

---

## Common Issues & Fixes

### Issue 1: Build Fails
**Error:** `Cannot find module` or `Build failed`

**Solution:**
- Verify Root Directory is `backend` (not root folder)
- Check `package.json` exists in backend folder
- Ensure all dependencies listed in package.json

### Issue 2: MongoDB Connection Timeout
**Error:** `MongoNetworkError: failed to connect`

**Solution:**
- Check MONGODB_URI environment variable
- In MongoDB Atlas, go to Network Access → Add IP Address → Allow All (0.0.0.0/0)
- Verify database user credentials
- Check database name in connection string

### Issue 3: Port Not Detected
**Error:** `Error: PORT environment variable not set`

**Solution:**
- Already handled in server.js: `process.env.PORT || 5000`
- Verify PORT env var is set on Render (should be automatic)

### Issue 4: CORS Errors from Frontend
**Error:** `Access-Control-Allow-Origin` issues

**Solution:**
- Add FRONTEND_URL environment variable with Vercel URL
- Or temporarily test with CORS disabled (development only)
- Check browser console for exact error

### Issue 5: 500 Internal Server Error
**Error:** Routes returning 500

**Solution:**
- Check Render logs for detailed error
- Verify all required env vars are set
- Check database collections exist
- Run seed script if needed: `npm run seed`

---

## Performance Optimization (Optional)

### For Better Response Times:
1. **Choose Right Region:** Select Render region closest to users
2. **Upgrade Instance:** Free tier has limited resources
3. **Enable Auto-Deploy:** Connect to GitHub for automatic updates
4. **Set Up Monitoring:** Use Render's built-in metrics

---

## Security Checklist

- [x] `.env` file NOT committed to Git ✅
- [x] Strong JWT secrets generated ✅
- [x] MongoDB using Atlas (not hardcoded credentials) ✅
- [x] Helmet.js security headers enabled ✅
- [x] Rate limiting on auth routes ✅
- [x] HTTPS enforced by Render ✅
- [ ] MongoDB Atlas IP whitelist restricted (after testing) ⚠️
- [ ] Email credentials secured (if using) ⚠️

---

## Success Criteria ✅

Your deployment is successful when:

- [x] Render shows "Live" status (green checkmark)
- [x] `/api/health` returns success: true
- [x] MongoDB connection shows "connected"
- [x] Can login with demo credentials
- [x] Stock data loads correctly
- [x] No errors in Render logs
- [x] API responds within 2 seconds

---

## Next Steps After Backend Deploy

1. **Test Backend Thoroughly**
   - Try all API endpoints
   - Verify WebSocket connections work
   - Test admin panel functionality

2. **Deploy Frontend to Vercel**
   - Push frontend code
   - Update API base URL in `frontend/src/api/index.js`
   - Add Vercel URL to Render's FRONTEND_URL env var

3. **Share Demo Link**
   - Backend: `https://tradex-backend.onrender.com`
   - Frontend: `https://your-app.vercel.app`
   - Credentials: user@tradex.in / Demo@123456

---

## Support Resources

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas
- **Node.js on Render:** https://render.com/docs/node-version
- **Community:** Render Discord, Stack Overflow

---

**Status:** Ready to Deploy 🚀

All configuration files prepared. Follow the steps above to deploy!
