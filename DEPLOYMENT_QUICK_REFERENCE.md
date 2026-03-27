# 🚀 TradeX Deployment - Quick Reference Card

## ✅ COMPLETED (March 27, 2026)

### GitHub Repository
- **Repo:** https://github.com/Varun9528/TRADEX
- **Branch:** master
- **Latest Commit:** `14f06b4`
- **Status:** ✅ PUSHED SUCCESSFULLY

### Backend (Render)
- **URL:** https://tradex-384m.onrender.com
- **Health:** ✅ LIVE & RUNNING
- **Database:** ✅ CONNECTED
- **Auto-Deploy:** ✅ ENABLED

### Frontend (Vercel)
- **Project ID:** prj_6mWx0ocPbrRftq7qPAgaqXv6GcI1
- **Build:** ✅ SUCCESSFUL
- **Auto-Deploy:** ✅ ENABLED
- **⚠️ ACTION REQUIRED:** Set environment variable & verify correct app

---

## 🔴 IMMEDIATE ACTIONS NEEDED

### 1. Set Vercel Environment Variable
```bash
cd C:\xampp\htdocs\tradex\frontend
vercel env add VITE_API_URL https://tradex-384m.onrender.com
```
Select "Production" when prompted.

### 2. Redeploy Frontend
```bash
vercel --prod
```

### 3. Verify Correct App
Visit your Vercel URL and confirm it shows **TradeX** (not "Conduit")

---

## 📊 DEPLOYMENT COMMANDS

### Push to Production
```bash
cd C:\xampp\htdocs\tradex
git add .
git commit -m "fix: description"
git push origin master
```

### Manual Backend Deploy (Render)
- Auto-deploys on git push
- Manual trigger: Render Dashboard → Deploy → Deploy

### Manual Frontend Deploy (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

---

## 🔗 PRODUCTION URLs

| Service | URL | Status |
|---------|-----|--------|
| **Backend API** | https://tradex-384m.onrender.com | ✅ Live |
| **Frontend** | Check Vercel Dashboard | ⚠️ Needs Config |
| **GitHub** | https://github.com/Varun9528/TRADEX | ✅ Updated |

---

## 🧪 TESTING CHECKLIST

After deployment, test:

- [ ] Frontend loads without errors
- [ ] Login/Register works
- [ ] Wallet page accessible
- [ ] Add funds request works
- [ ] Withdraw request works
- [ ] Trading (buy/sell) functional
- [ ] Portfolio updates correctly
- [ ] Admin panel accessible
- [ ] Fund approval workflow works
- [ ] No console errors
- [ ] Mobile responsive

---

## 🔧 ENVIRONMENT VARIABLES

### Backend (Render Dashboard)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
PORT=5000
TWELVEDATA_API_KEY=your_api_key
FRONTEND_URL=https://your-vercel-url.vercel.app
ADMIN_EMAIL=admin@tradex.in
ADMIN_PASSWORD=Admin@123456
```

### Frontend (Vercel Dashboard)
```
VITE_API_URL=https://tradex-384m.onrender.com
```

---

## 🐛 TROUBLESHOOTING

### Frontend Shows Wrong App
1. Delete `.vercel` folder
2. Run: `vercel link --repo`
3. Redeploy: `vercel --prod`

### API Connection Errors
1. Verify `VITE_API_URL` in Vercel env
2. Check backend is running: curl https://tradex-384m.onrender.com/api/health
3. Check CORS settings in backend

### Build Failures
```bash
cd frontend
npm install
npm run build
# Fix any errors shown
vercel --prod
```

---

## 📈 MONITORING

- **Render Logs:** https://dashboard.render.com
- **Vercel Analytics:** https://vercel.com/dashboard
- **Database:** MongoDB Atlas Dashboard

---

**Last Updated:** March 27, 2026  
**Deployment Status:** Backend ✅ | Frontend ⚠️
