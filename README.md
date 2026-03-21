# TradeX India — Full-Stack Trading Platform

A production-ready Indian stock brokerage demo platform built with Node.js, Express, MongoDB, React, and Socket.IO.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | Zustand + React Query |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (Access + Refresh tokens) |
| Real-time | Socket.IO |
| File Upload | Multer (Local storage) |
| Email | Nodemailer |
| Logging | Winston |

---

## Project Structure

```
tradex/
├── backend/
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   └── cloudinary.js      # File upload config
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── KYC.js             # KYC documents schema
│   │   ├── Stock.js           # Stock/price schema
│   │   ├── Order.js           # Orders + Holdings
│   │   ├── Transaction.js     # Wallet transactions
│   │   └── Watchlist.js       # Watchlist + Notifications
│   ├── routes/
│   │   ├── auth.js            # Register, Login, Refresh
│   │   ├── users.js           # Profile management
│   │   ├── kyc.js             # KYC document upload
│   │   ├── stocks.js          # Stock data + history
│   │   ├── trades.js          # Place orders, holdings
│   │   ├── wallet.js          # Funds, withdrawals
│   │   ├── watchlist.js       # Watchlist CRUD
│   │   ├── orders.js          # Order history
│   │   ├── notifications.js   # Notification management
│   │   └── admin.js           # Full admin panel API
│   ├── utils/
│   │   ├── priceEngine.js     # Live price simulation engine
│   │   ├── seeder.js          # DB seed (30+ stocks + users)
│   │   ├── email.js           # Email templates
│   │   └── logger.js          # Winston logger
│   └── server.js              # Main entry point
│
└── frontend/
    └── src/
        ├── api/index.js        # Axios API client
        ├── context/
        │   ├── authStore.js    # Zustand auth state
        │   └── SocketContext   # Socket.IO provider
        └── pages/
            ├── LandingPage.jsx
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── AppLayout.jsx   # Sidebar + topbar shell
            ├── Dashboard.jsx
            ├── TradingPage.jsx
            ├── WatchlistPage.jsx
            ├── PortfolioPage.jsx
            ├── OrdersPage.jsx
            ├── WalletPage.jsx
            ├── KYCPage.jsx
            ├── NotificationsPage.jsx
            ├── ReferralPage.jsx
            ├── ProfilePage.jsx
            └── admin/
                ├── AdminDashboard.jsx
                ├── AdminKYC.jsx
                ├── AdminUsers.jsx
                ├── AdminWallet.jsx
                └── AdminStocks.jsx
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- No external services required - file uploads work locally!

### 2. Clone and Install

```bash
git clone <repo>
cd tradex
npm run install:all
```

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
MONGODB_URI=mongodb://localhost:27017/tradex_india
JWT_SECRET=your_super_secret_32_char_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
```

Note: Cloudinary is NOT required. File uploads work locally without any API keys!

### 4. Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- **32 Indian stocks** with realistic data
- **Admin user**: `admin@tradex.in` / `Admin@123456`
- **Demo user**: `user@tradex.in` / `Demo@123456`

### 5. Run Development Servers

```bash
# From root — runs both backend + frontend
npm run dev

# Or separately:
npm run dev:backend   # Backend on :5000
npm run dev:frontend  # Frontend on :3000
```

### 6. Open the App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health check**: http://localhost:5000/api/health

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### KYC
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kyc/status` | KYC status + data |
| PUT | `/api/kyc/personal` | Submit personal details |
| PUT | `/api/kyc/pan` | Upload PAN card |
| PUT | `/api/kyc/aadhaar` | Upload Aadhaar |
| PUT | `/api/kyc/bank` | Submit bank details |
| PUT | `/api/kyc/selfie` | Upload selfie |
| POST | `/api/kyc/submit` | Final submission |

### Stocks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stocks` | All stocks (with filters) |
| GET | `/api/stocks/:symbol` | Stock details |
| GET | `/api/stocks/:symbol/history` | Price history |

### Trading
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trades/order` | Place buy/sell order |
| GET | `/api/trades/orders` | Order history |
| GET | `/api/trades/holdings` | Current holdings + P&L |
| DELETE | `/api/trades/orders/:id` | Cancel order |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet/balance` | Current balance |
| GET | `/api/wallet/transactions` | Transaction history |
| POST | `/api/wallet/add` | Add funds |
| POST | `/api/wallet/withdraw` | Request withdrawal |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Stats overview |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/kyc` | KYC queue |
| PATCH | `/api/admin/kyc/:userId/review` | Approve/reject KYC |
| PATCH | `/api/admin/wallet/adjust` | Add/deduct balance |
| PATCH | `/api/admin/stocks/:symbol/price` | Override stock price |
| GET | `/api/admin/withdrawals` | Withdrawal requests |
| PATCH | `/api/admin/withdrawals/:id` | Process withdrawal |

---

## Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `price:update` | Server → Client | Bulk price update every 3s |
| `order:executed` | Server → User | Order execution confirmation |
| `kyc:status_update` | Server → User | KYC approved/rejected |
| `wallet:updated` | Server → User | Balance changed |
| `join:stocks` | Client → Server | Subscribe to live prices |
| `join:user` | Client → Server | Join personal room |

---

## Production Deployment

### Environment Variables (Production)

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tradex
JWT_SECRET=<64-char-random-string>
FRONTEND_URL=https://yourdomain.com
```

### Build Frontend

```bash
cd frontend && npm run build
```

### Deploy to Render (Recommended for Demo)

**Quick Steps:**
1. Push code to GitHub
2. Go to https://render.com → New Web Service
3. Connect repository, set Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variables from `.env.render`

**Required Environment Variables:**
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<your-secret>
FRONTEND_URL=https://your-app.vercel.app (add after Vercel deploy)
```

📖 **Complete Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions

**Other Platforms:** Railway, AWS, Heroku, DigitalOcean

### MongoDB Atlas

Replace `MONGODB_URI` with your Atlas connection string.

### File Uploads (Local - No Setup Required!)

File uploads are handled locally by default. No external service needed!
- Files stored in: `/backend/uploads/kyc/`
- Supports: JPG, PNG, PDF (max 5MB)
- Selfies: JPG, PNG (max 3MB)

---

## Features Implemented

- ✅ JWT Authentication (access + refresh tokens)
- ✅ Role-based access (User / Admin)
- ✅ KYC 5-step flow with local file upload (no external service required)
- ✅ Admin KYC approval panel with document preview
- ✅ Live price engine (Socket.IO, updates every 3s)
- ✅ Buy/Sell with MARKET and LIMIT orders
- ✅ Real wallet deduction/credit on trades
- ✅ Brokerage + tax calculation (STT, GST, stamp duty)
- ✅ Portfolio P&L with holdings tracking
- ✅ Wallet: add funds, withdraw, full transaction history
- ✅ Watchlist with live prices
- ✅ Notifications system (in-app + email)
- ✅ Referral system with unique codes
- ✅ Admin: user management, wallet control, stock price override
- ✅ Rate limiting, Helmet security, input validation
- ✅ Winston logging to file + console
- ✅ Account lockout after 5 failed login attempts
- ✅ Responsive dark UI with Tailwind CSS

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| User | user@tradex.in | Demo@123456 |
| Admin | admin@tradex.in | Admin@123456 |
