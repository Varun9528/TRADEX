# 🚀 Deploy Frontend to Vercel

## Quick Deploy Steps

### Step 1: Push Code to GitHub (Already Done ✅)
Your code is already on GitHub at: https://github.com/Varun9528/TRADEX

### Step 2: Create .env File for Production

**File: `frontend/.env`**
```bash
VITE_API_URL=https://tradex-384m.onrender.com
```

✅ This file has been created with the production backend URL

### Step 3: Deploy to Vercel

**Option A: Using Vercel Dashboard (Recommended)**

1. **Go to Vercel:** https://vercel.com/new
2. **Sign in** with GitHub account
3. **Import Project:**
   - Click "Add New..." → "Project"
   - Select repository: **TRADEX**
   - Click "Import"

4. **Configure Project:**
   ```
   Framework Preset: Vite
   Root Directory: ./frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

5. **Add Environment Variables:**
   Click "Environment Variables" → "Add Variable":
   ```
   Name: VITE_API_URL
   Value: https://tradex-384m.onrender.com
   ```

6. **Deploy:**
   - Click "Deploy"
   - Wait 2-5 minutes for build
   - Copy your Vercel URL: `https://tradex.vercel.app`

**Option B: Using Vercel CLI**

```bash
npm install -g vercel
cd frontend
vercel login
vercel --prod
```

---

## Post-Deployment Configuration

### Step 4: Update Backend CORS

After deploying frontend, add your Vercel URL to Render's environment variables:

1. Go to Render Dashboard → Your service → Environment
2. Add/Update variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Click "Save Changes"
4. Service will automatically redeploy

### Step 5: Test Full Integration

**Test these pages:**

1. **Login Page:**
   - Visit: `https://your-app.vercel.app/login`
   - Login with: `user@tradex.in` / `Demo@123456`
   - Should redirect to Dashboard

2. **Dashboard:**
   - Check if stocks load from live backend
   - Verify real-time price updates (WebSocket)

3. **KYC Page:**
   - Test form submissions
   - Upload documents (mock upload works locally)

4. **Portfolio:**
   - Check holdings display
   - Verify wallet balance

5. **Orders:**
   - View order history
   - Place test orders

---

## Environment Variables Reference

### Frontend (.env)
```bash
# Production
VITE_API_URL=https://tradex-384m.onrender.com

# Local Development (comment out for production)
# VITE_API_URL=http://localhost:5000
```

### Backend (Render Environment)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
FRONTEND_URL=https://your-app.vercel.app
```

---

## Testing Checklist

### Before Deployment
- [ ] `.env` file created with production URL
- [ ] API base URL updated in `src/api/index.js`
- [ ] Socket.io configured for production
- [ ] Token storage working (localStorage)
- [ ] Authorization headers set correctly

### After Deployment
- [ ] Vercel build successful
- [ ] No console errors on homepage
- [ ] Login works with live backend
- [ ] JWT token stored in localStorage
- [ ] Protected routes require authentication
- [ ] API calls include Authorization header
- [ ] WebSocket connects successfully
- [ ] Real-time price updates working
- [ ] All pages load correctly

---

## Troubleshooting

### Issue 1: Build Fails on Vercel
**Error:** `VITE_API_URL is not defined`

**Solution:**
- Ensure `.env` file exists in `frontend/` folder
- Or add environment variable in Vercel dashboard

### Issue 2: CORS Errors
**Error:** `Access-Control-Allow-Origin` issues

**Solution:**
1. Add Vercel URL to Render's `FRONTEND_URL` env var
2. Wait for Render to redeploy
3. Clear browser cache and retry

### Issue 3: API Calls Fail (404)
**Error:** Routes not found

**Solution:**
- Check `VITE_API_URL` is correct (no trailing slash)
- Verify backend is running on Render
- Test backend directly: `https://tradex-384m.onrender.com/api/health`

### Issue 4: WebSocket Connection Fails
**Error:** Socket.IO connection refused

**Solution:**
- Render supports WebSockets by default
- Check browser console for exact error
- Ensure path includes `/socket.io/`

### Issue 5: Login Works But Data Doesn't Load
**Error:** 401 Unauthorized on protected routes

**Solution:**
- Check if token is stored in localStorage
- Verify Authorization header format: `Bearer <token>`
- Check token expiration in backend logs

---

## Performance Optimization

### 1. Enable Gzip Compression
Already handled by Helmet.js in backend

### 2. Optimize Images
Use WebP format for logos and icons

### 3. Lazy Loading
Implement React.lazy for routes (optional)

### 4. CDN for Static Assets
Vercel automatically uses global CDN

---

## Security Best Practices

✅ **Already Implemented:**
- HTTPS enforced by Vercel & Render
- JWT tokens for authentication
- CORS protection
- Rate limiting on auth routes
- Helmet.js security headers

⚠️ **Additional Recommendations:**
- Never commit `.env` files
- Use strong passwords
- Enable 2FA on accounts
- Regular security audits

---

## Monitoring & Analytics

### Vercel Analytics
Enable in dashboard for performance metrics

### Error Tracking
Consider adding:
- Sentry for error monitoring
- LogRocket for session replay
- Google Analytics for user behavior

---

## Cost Estimation

**Vercel Free Tier:**
- Unlimited deployments
- 100GB bandwidth/month
- Perfect for demos & MVPs

**Render Free Tier:**
- 750 hours/month
- Auto-sleep after 15 min inactivity
- Upgrade to Starter ($7/mo) for no sleep

---

## Success Criteria

Your deployment is successful when:

✅ Vercel shows "Ready" status  
✅ Homepage loads without errors  
✅ Login redirects to dashboard  
✅ Stock data loads from MongoDB Atlas  
✅ WebSocket shows connected in console  
✅ KYC forms submit successfully  
✅ Admin panel accessible  
✅ No CORS errors in console  

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html
- **React Router Deployment:** https://reactrouter.com/en/main/start/faq
- **Socket.IO Production:** https://socket.io/docs/v4/using-multiple-nodes/

---

**🎉 Ready to Deploy!**

Follow the steps above to deploy your frontend to Vercel and connect it to your live backend on Render.

**Expected Result:**
- Frontend: `https://tradex.vercel.app`
- Backend: `https://tradex-384m.onrender.com`
- Database: MongoDB Atlas (cloud)

---

*Last Updated: March 20, 2026*  
*Project: TradeX India Stock Trading Platform*
