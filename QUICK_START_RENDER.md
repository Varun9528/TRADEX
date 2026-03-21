# ⚡ Quick Start Render Deployment

## 5-Minute Deploy Guide

### Prerequisites (Already Done ✅)
- [x] MongoDB Atlas connected
- [x] Database seeded with demo data
- [x] Backend configured for production
- [x] Environment variables ready in `.env.render`

---

### Step 1: Push to GitHub (2 minutes)

```bash
cd c:\xampp\htdocs\tradex

# Initialize git if not already done
git init
git add .
git commit -m "Ready for Render deployment"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/tradex.git
git push -u origin main
```

---

### Step 2: Deploy to Render (3 minutes)

1. **Go to Render:** https://dashboard.render.com/new
2. **Sign in** with GitHub
3. **Click "New +" → "Web Service"**
4. **Connect repository:** Select `tradex`
5. **Configure:**
   ```
   Name: tradex-backend
   Region: Oregon (or your choice)
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   Instance: Free
   ```
6. **Advanced → Add Environment Variables:**
   Click "Add Variable" and paste each from `.env.render`:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=mongodb+srv://...` (full string from .env.render)
   - `JWT_SECRET=386c1494...` (full 64-char string)
   - `JWT_EXPIRE=7d`
   - `JWT_REFRESH_SECRET=dd846cdf...` (full string)
   - `JWT_REFRESH_EXPIRE=30d`
   - `ADMIN_EMAIL=admin@tradex.in`
   - `ADMIN_PASSWORD=Admin@123456`

7. **Click "Create Web Service"**

---

### Step 3: Wait & Verify (5 minutes)

**Wait for deployment:**
- Status will show "Deploying..." (blue)
- Then changes to "Live" (green checkmark)

**Test immediately:**
```bash
# Replace YOUR_URL with your render URL
curl https://YOUR_URL.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "TradeX India API is running",
  "db": "connected"
}
```

---

### Step 4: Test Demo Login

```bash
curl -X POST https://YOUR_URL.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@tradex.in","password":"Demo@123456"}'
```

Should return JWT token + user data.

---

## 🎉 Done!

Your backend is now live at: `https://tradex-backend.onrender.com`

**Next:** Deploy frontend to Vercel and connect to this backend!

---

## Troubleshooting

**Build Failed?**
- Check Root Directory is `backend` (not empty)
- Verify package.json exists in backend folder

**MongoDB Error?**
- In MongoDB Atlas: Network Access → Add IP → Allow All (0.0.0.0/0)
- Verify MONGODB_URI is complete and correct

**CORS Errors?**
- Normal until frontend is deployed
- Will fix when you add Vercel URL to FRONTEND_URL

---

## Need Help?

- Full guide: `DEPLOYMENT.md`
- Checklist: `RENDER_CHECKLIST.md`
- Render docs: https://render.com/docs

---

**Status: Ready to Deploy 🚀**
