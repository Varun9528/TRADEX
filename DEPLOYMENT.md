# TradeX Backend Deployment Guide for Render

## 🚀 Deploy Backend to Render

### Step 1: Prepare Your Repository

1. **Ensure your code is on GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Repository Structure Required:**
   ```
   tradex/
   ├── backend/
   │   ├── server.js
   │   ├── package.json
   │   ├── .env.example
   │   └── ... (other backend files)
   ├── frontend/
   └── README.md
   ```

### Step 2: Create Render Account & Connect GitHub

1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository

### Step 3: Configure Render Web Service

**Basic Settings:**
- **Name:** `tradex-backend`
- **Region:** Choose closest to your users (e.g., Oregon, Singapore)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- **Free Tier:** Select "Free" instance
- **Production:** Select "Standard" or "Pro" for better performance

### Step 4: Set Environment Variables on Render

In Render dashboard, go to **Environment** tab and add these variables:

```
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://varuntirole210:Varun%4007067@worksuperfast.2ra3pek.mongodb.net/tradex_india?retryWrites=true&w=majority&appName=worksuperfast

# JWT Secrets (use your existing values from .env)
JWT_SECRET=386c1494d316c643c55d0dd2a8bc0710fb27b747ffaa4f85880792a671fd926f
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=dd846cdf779d43a3dd602c92f5ecc590e3abc0cd807217fa1ff56c50b371d355
JWT_REFRESH_EXPIRE=30d

# Email (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=TradeX India <noreply@tradex.in>

# Admin Credentials
ADMIN_EMAIL=admin@tradex.in
ADMIN_PASSWORD=Admin@123456

# Frontend URL (Add after deploying frontend to Vercel)
FRONTEND_URL=https://your-app.vercel.app
```

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will build and deploy automatically
3. Wait for deployment to complete (~2-5 minutes)
4. Copy your public URL (e.g., `https://tradex-backend.onrender.com`)

### Step 6: Verify Deployment

Test your deployed backend:

```bash
# Health check
curl https://tradex-backend.onrender.com/api/health

# Test stocks API
curl https://tradex-backend.onrender.com/api/stocks?limit=5

# Expected response format:
{
  "success": true,
  "message": "TradeX India API is running",
  "version": "1.0.0",
  "timestamp": "2026-03-20T...",
  "db": "connected"
}
```

### Step 7: Update Frontend API Configuration

After backend is deployed, update frontend to use the public URL:

**File: `frontend/src/api/index.js`**
```javascript
const API_BASE_URL = 'https://tradex-backend.onrender.com/api';
// Instead of http://localhost:5000/api
```

---

## 🔧 Troubleshooting

### Common Issues:

**1. Port Configuration Error**
- ✅ Already handled: `process.env.PORT || 5000` in server.js

**2. MongoDB Connection Failed**
- Check MONGODB_URI environment variable
- Ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
- Verify database name in connection string

**3. CORS Errors**
- Add your frontend URL to FRONTEND_URL environment variable
- Or temporarily set to `*` for testing (not recommended for production)

**4. Build Fails**
- Ensure Root Directory is set to `backend`
- Check package.json has correct start script: `"start": "node server.js"`

**5. WebSocket Connection Issues**
- Render supports WebSocket connections by default
- No additional configuration needed

---

## 📊 Post-Deployment Checklist

- [ ] Backend URL accessible: `https://tradex-backend.onrender.com`
- [ ] Health endpoint working: `/api/health`
- [ ] MongoDB connected successfully
- [ ] All API routes responding
- [ ] CORS configured for frontend domain
- [ ] Environment variables set correctly
- [ ] Logs show no errors
- [ ] Demo accounts can login

---

## 🔐 Security Recommendations

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use strong JWT secrets** - Already generated
3. **Enable HTTPS only** - Render does this automatically
4. **Set up monitoring** - Use Render's built-in monitoring
5. **Regular backups** - MongoDB Atlas provides automatic backups

---

## 💰 Cost Estimation

**Free Tier:**
- 750 hours/month (enough for 1 service running 24/7)
- 512MB RAM
- Shared CPU
- Auto-sleep after 15 minutes of inactivity

**Paid Plans (if needed):**
- Starter: $7/month (no sleep, faster instances)
- Standard: Starting at $15/month

---

## 📈 Monitoring & Logs

Access logs in Render Dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. View real-time logs
4. Download logs if needed

---

## 🎯 Next Steps

1. Deploy frontend to Vercel
2. Update frontend API base URL
3. Update CORS whitelist with production URLs
4. Test full application flow
5. Share demo link with clients

---

**Support:** For Render-specific issues, check https://render.com/docs
