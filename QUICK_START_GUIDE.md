# 🚀 Hotel Management System - Quick Start Guide

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

## 🎯 Quickest Way to Start

### Option 1: Automated Setup (Recommended)

```bash
# Run the automated setup script
./setup.sh
```

This will:
- ✅ Check system requirements
- ✅ Install all dependencies
- ✅ Create configuration files
- ✅ Generate security keys
- ✅ Setup database (optional)

### Option 2: Manual Setup

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# 3. Start development servers
cd backend && npm run dev
cd ../frontend && npm run dev
```

## 🌐 Access the Application

After starting:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Docs**: http://localhost:5000/api-docs

## 👤 Default Credentials

### Admin Account
```
Email: admin@hotel.com
Password: Admin123!
```

### Manager Account
```
Email: manager@hotel.com
Password: Manager123!
```

### Staff Account
```
Email: staff@hotel.com
Password: Staff123!
```

### Guest Account
```
Email: guest@hotel.com
Password: Guest123!
```

## 🎨 Features Overview

### ✅ Core Features (Ready to Use)
- User authentication & authorization
- Room management & booking
- Check-in/Check-out system
- Dashboard & analytics
- Task management
- Invoice generation
- Guest services
- Reviews & ratings
- Financial tracking

### 🍽️ Food System (Fully Integrated)
- Menu management
- Food ordering (guest & staff)
- Order tracking
- Food reviews & ratings
- AI menu extraction (requires Google Vision API)
- Kitchen order management

### 📧 Communication
- Email notifications (requires SMTP)
- SMS notifications (requires Twilio)
- In-app notifications

### 💳 Payments
- Credit card processing (requires Stripe)
- PayPal integration (requires PayPal credentials)
- Invoice management

## ⚙️ Essential Configuration

### 1. Database Connection

**Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/hotel_management
```

**MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel_management
```

### 2. JWT Secret (Required)

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `backend/.env`:
```env
JWT_SECRET=your_generated_secret_here
```

### 3. Frontend API URL

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🔧 Optional Features Configuration

### Google Vision API (Menu AI Extraction)

1. Get credentials from [Google Cloud Console](https://console.cloud.google.com)
2. Save to `backend/config/google-credentials.json`
3. Enable in `.env`:
```env
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
```

📖 **Full guide**: See `PRODUCTION_CONFIG_GUIDE.md` → Section 1

### Email Notifications (SMTP)

Add to `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

📖 **Full guide**: See `PRODUCTION_CONFIG_GUIDE.md` → Section 2

### Facebook OAuth Login

1. Create app at [Facebook Developers](https://developers.facebook.com)
2. Add to `backend/.env`:
```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback
```

📖 **Full guide**: See `PRODUCTION_CONFIG_GUIDE.md` → Section 3

### SMS Notifications (Twilio)

Add to `backend/.env`:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

📖 **Full guide**: See `PRODUCTION_CONFIG_GUIDE.md` → Section 5

### Image Storage (Cloudinary)

Add to `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

📖 **Full guide**: See `PRODUCTION_CONFIG_GUIDE.md` → Section 4

### Payment Processing (Stripe)

Add to `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

📖 **Full guide**: See `PRODUCTION_CONFIG_GUIDE.md` → Section 11

## 🧪 Testing the Setup

### Backend Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-09T...",
  "database": "connected"
}
```

### Test Food API
```bash
curl http://localhost:5000/api/food/items
```

### Test Menu API
```bash
curl http://localhost:5000/api/menu/items
```

## 📁 Project Structure

```
Hotel_Management/
├── backend/              # Node.js/Express API
│   ├── controllers/      # Request handlers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, validation, etc.
│   ├── config/          # Configuration files
│   └── server.js        # Entry point
│
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── ui/      # Original UI (DO NOT MODIFY)
│   │   │   └── food/    # Food-specific UI
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── services/    # API services
│   └── public/          # Static assets
│
└── mongodb-data/        # Sample data
```

## 🎯 Common Tasks

### Add Admin User
```bash
cd backend
node scripts/createAdmin.js
```

### Seed Database
```bash
cd backend
npm run seed
```

### Reset Admin Password
```bash
cd backend
node resetAdminPassword.js
```

### Clear All Data
```bash
cd backend
node scripts/clearDatabase.js
```

### Run Tests
```bash
cd backend && npm test
cd frontend && npm test
```

## 🐛 Troubleshooting

### Port Already in Use

**Backend (5000):**
```bash
# Find process
lsof -ti:5000
# Kill process
kill -9 $(lsof -ti:5000)
```

**Frontend (5173):**
```bash
# Find process
lsof -ti:5173
# Kill process
kill -9 $(lsof -ti:5173)
```

### MongoDB Connection Failed

1. Check MongoDB is running:
```bash
mongod --version
ps aux | grep mongod
```

2. Use MongoDB Atlas instead (recommended for production)

3. Check connection string format:
```
mongodb://localhost:27017/hotel_management
# OR
mongodb+srv://user:pass@cluster.mongodb.net/hotel_management
```

### CORS Errors

Update `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

### Module Not Found

```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
```

### Google Vision API Not Working

1. Check credentials file exists: `backend/config/google-credentials.json`
2. Verify env variable: `GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json`
3. Ensure Vision API is enabled in Google Cloud Console
4. Check service account has proper permissions

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| `QUICK_START_GUIDE.md` | This file - get started quickly |
| `PRODUCTION_CONFIG_GUIDE.md` | Detailed production setup |
| `FOOD_SYSTEM_IMPLEMENTATION_SUMMARY.md` | Food system architecture |
| `SYSTEM_DOCUMENTATION.md` | Overall system documentation |
| `README.md` | Project overview |

## 🆘 Getting Help

### Check Logs

**Backend:**
```bash
cd backend
tail -f logs/error.log
tail -f logs/combined.log
```

**Frontend:**
Check browser console (F12)

### Common Issues

1. **"Cannot find module"** → Run `npm install`
2. **"Port in use"** → Kill process or change port
3. **"MongoDB connection error"** → Check MongoDB service
4. **"JWT malformed"** → Generate new JWT_SECRET
5. **"CORS error"** → Update CORS_ORIGIN in .env

### Full Troubleshooting

See `PRODUCTION_CONFIG_GUIDE.md` → Section 14 (Troubleshooting)

## 🎉 You're All Set!

The system is now ready to use. All core features work out of the box.

**Optional features** (Google Vision, Email, SMS, etc.) can be configured later as needed.

**Next Steps:**
1. ✅ Login with default credentials
2. ✅ Explore the dashboard
3. ✅ Create test bookings
4. ✅ Try the food ordering system
5. ✅ Configure optional features (see PRODUCTION_CONFIG_GUIDE.md)

---

**Happy Managing! 🏨**

For detailed configuration, see: `PRODUCTION_CONFIG_GUIDE.md`
