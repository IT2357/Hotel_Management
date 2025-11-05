# 🚀 Deployment Guide - Food System 2025

## 📋 Overview

This guide provides step-by-step instructions for deploying the Jaffna Restaurant Food Ordering System to production. It covers environment setup, database configuration, payment gateway integration, and monitoring.

---

## 🔧 Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **MongoDB**: 6.0 or higher
- **Redis**: 7.0 or higher (optional, for caching)
- **Nginx**: Latest stable (for reverse proxy)
- **PM2**: Latest (for process management)

### Domain & SSL
- Registered domain name (e.g., `jaffna-restaurant.lk`)
- SSL certificate (Let's Encrypt or commercial)
- DNS configured (A record pointing to server IP)

---

## 📦 Environment Variables

### Backend (.env)

Create `/backend/.env` with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
API_BASE_URL=https://api.jaffna-restaurant.lk

# Database
MONGODB_URI=mongodb://localhost:27017/jaffna_food_production
MONGODB_USER=food_admin
MONGODB_PASSWORD=your_secure_password_here
MONGODB_AUTH_SOURCE=admin

# JWT Authentication
JWT_SECRET=your_256_bit_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# PayHere Payment Gateway (Sri Lanka)
PAYHERE_MERCHANT_ID=1234567
PAYHERE_MERCHANT_SECRET=your_payhere_merchant_secret_key
PAYHERE_NOTIFY_URL=https://api.jaffna-restaurant.lk/api/payments/payhere/notify
PAYHERE_RETURN_URL=https://jaffna-restaurant.lk/order-success
PAYHERE_CANCEL_URL=https://jaffna-restaurant.lk/order-cancelled
PAYHERE_MODE=live

# Email (SendGrid or SMTP)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@jaffna-restaurant.lk
FROM_NAME=Jaffna Restaurant

# SMS Gateway (Dialog/Mobitel)
SMS_GATEWAY_URL=https://sms.gateway.lk/api/send
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=JAFFNA

# Redis (Optional - for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_TTL=3600

# CORS
CORS_ORIGIN=https://jaffna-restaurant.lk,https://www.jaffna-restaurant.lk
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/jaffna-food/app.log

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Frontend (.env.production)

Create `/frontend/.env.production`:

```env
# API Configuration
VITE_API_BASE_URL=https://api.jaffna-restaurant.lk/api
VITE_SOCKET_URL=wss://api.jaffna-restaurant.lk

# PayHere
VITE_PAYHERE_MERCHANT_ID=1234567
VITE_PAYHERE_MODE=live

# Cloudinary (for frontend uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=jaffna_menu_uploads

# Analytics
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
VITE_GTM_ID=GTM-XXXXXXX

# Feature Flags
VITE_ENABLE_AI_EXTRACTION=true
VITE_ENABLE_REVIEWS=true
VITE_ENABLE_UPSELLS=true
VITE_JAFFNA_DISCOUNT_PERCENTAGE=5

# Cache Busting
VITE_BUILD_VERSION=1.0.0
VITE_BUILD_DATE=2025-10-18
```

---

## 🗄️ Database Setup

### 1. Create MongoDB Database

```bash
# Connect to MongoDB shell
mongosh

# Create database
use jaffna_food_production

# Create admin user
db.createUser({
  user: "food_admin",
  pwd: "your_secure_password_here",
  roles: [
    { role: "readWrite", db: "jaffna_food_production" },
    { role: "dbAdmin", db: "jaffna_food_production" }
  ]
})
```

### 2. Create Indexes

```javascript
// Menu items - text search index
db.menuitems.createIndex(
  {
    name_english: "text",
    name_tamil: "text",
    description_english: "text",
    description_tamil: "text",
    ingredients: "text"
  },
  {
    name: "menu_text_search",
    default_language: "english",
    weights: {
      name_english: 10,
      name_tamil: 10,
      ingredients: 5,
      description_english: 3,
      description_tamil: 3
    }
  }
);

// Menu items - filter index
db.menuitems.createIndex(
  {
    category: 1,
    isAvailable: 1,
    isVeg: 1,
    isSpicy: 1,
    isPopular: 1,
    isDeleted: 1
  },
  { name: "menu_filters" }
);

// Menu items - price sorting
db.menuitems.createIndex({ price: 1 }, { name: "menu_price_sort" });

// Orders - user lookup
db.orders.createIndex({ userId: 1, createdAt: -1 }, { name: "orders_user" });

// Orders - status filter
db.orders.createIndex({ status: 1, createdAt: -1 }, { name: "orders_status" });

// Reviews - menu item aggregation
db.reviews.createIndex({ menuItemId: 1 }, { name: "reviews_menu_item" });

// Reviews - user lookup
db.reviews.createIndex({ userId: 1, createdAt: -1 }, { name: "reviews_user" });
```

### 3. Seed Initial Data

```bash
cd backend
node scripts/seedMenuItems.js
node scripts/seedCategories.js
```

---

## 🔐 PayHere Payment Gateway Setup

### 1. Register PayHere Account
- Visit: https://www.payhere.lk/
- Create merchant account
- Complete KYC verification
- Note down Merchant ID and Secret

### 2. Configure Webhooks

**Notify URL**: `https://api.jaffna-restaurant.lk/api/payments/payhere/notify`

**Allowed IPs**: Add your server IP to PayHere whitelist

### 3. Test Payment Flow

```bash
# Use sandbox mode first
PAYHERE_MODE=sandbox node backend/scripts/testPayment.js
```

### 4. Implement Payment Controller

Update `backend/controllers/paymentController.js`:

```javascript
const crypto = require('crypto');

// Generate PayHere hash
const generatePayHereHash = (merchantId, orderId, amount, currency, merchantSecret) => {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const amountFormatted = parseFloat(amount).toFixed(2);
  const hashString = `${merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`;

  return crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
};

// PayHere notify handler
exports.payhereNotify = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig
    } = req.body;

    // Verify hash
    const localHash = generatePayHereHash(
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      process.env.PAYHERE_MERCHANT_SECRET
    );

    if (localHash !== md5sig) {
      return res.status(400).json({ error: 'Invalid hash' });
    }

    // Update order status
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status_code === '2') {
      // Payment success
      order.status = 'confirmed';
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        method: 'payhere',
        transactionId: req.body.payment_id,
        paidAt: new Date()
      };
    } else {
      // Payment failed
      order.status = 'payment_failed';
      order.paymentStatus = 'failed';
    }

    await order.save();

    res.status(200).send('OK');
  } catch (error) {
    console.error('PayHere notify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

---

## 🖼️ Cloudinary Setup

### 1. Create Account
- Visit: https://cloudinary.com/
- Sign up for free account (25GB storage, 25GB bandwidth/month)

### 2. Configure Upload Presets

1. Go to **Settings → Upload**
2. Create preset `jaffna_menu_uploads`:
   - Signing Mode: **Unsigned**
   - Folder: `jaffna-menu`
   - Allowed formats: `jpg, png, webp`
   - Max file size: `10MB`
   - Image transformations:
     - Width: `1200px`
     - Height: `900px`
     - Crop: `limit`
     - Quality: `auto:good`
     - Format: `auto`

### 3. Configure Transformations

Create named transformation `menu_thumbnail`:
```
w_400,h_300,c_fill,g_auto,f_auto,q_auto:good
```

Usage in code:
```javascript
const thumbnailUrl = menuItem.imageUrl.replace('/upload/', '/upload/t_menu_thumbnail/');
```

---

## 🌐 Nginx Configuration

Create `/etc/nginx/sites-available/jaffna-food`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name jaffna-restaurant.lk www.jaffna-restaurant.lk;
    return 301 https://$server_name$request_uri;
}

# Frontend (HTTPS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name jaffna-restaurant.lk www.jaffna-restaurant.lk;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/jaffna-restaurant.lk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jaffna-restaurant.lk/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory
    root /var/www/jaffna-food/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Error pages
    error_page 404 /index.html;
}

# Backend API (HTTPS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.jaffna-restaurant.lk;

    # SSL Configuration (same as above)
    ssl_certificate /etc/letsencrypt/live/jaffna-restaurant.lk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jaffna-restaurant.lk/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Reverse proxy to Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size
    client_max_body_size 10M;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/jaffna-food /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔄 PM2 Process Management

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Create Ecosystem File

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'jaffna-food-api',
      script: './backend/server.js',
      cwd: '/var/www/jaffna-food',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/jaffna-food/api-error.log',
      out_file: '/var/log/jaffna-food/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### 3. Start Application

```bash
cd /var/www/jaffna-food
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Monitor Processes

```bash
pm2 status
pm2 logs jaffna-food-api
pm2 monit
```

---

## 📊 Monitoring & Logging

### 1. Sentry Error Tracking

Install Sentry SDK:
```bash
cd backend
npm install @sentry/node
```

Configure in `backend/server.js`:
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### 2. PM2 Plus Monitoring

```bash
pm2 plus
pm2 link your-pm2-secret-key your-pm2-public-key
```

Features:
- Real-time metrics
- Exception tracking
- Custom metrics
- HTTP latency monitoring

### 3. Nginx Access Logs

Configure log rotation (`/etc/logrotate.d/nginx`):
```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

---

## 🔄 Deployment Workflow

### 1. Build Frontend

```bash
cd frontend
npm install
npm run build
```

### 2. Deploy to Server

```bash
# Copy files via rsync
rsync -avz --delete ./frontend/dist/ user@server:/var/www/jaffna-food/frontend/dist/
rsync -avz --exclude node_modules ./backend/ user@server:/var/www/jaffna-food/backend/
```

### 3. Install Backend Dependencies

```bash
ssh user@server
cd /var/www/jaffna-food/backend
npm install --production
```

### 4. Restart PM2

```bash
pm2 reload jaffna-food-api --update-env
```

### 5. Clear Nginx Cache

```bash
sudo nginx -s reload
```

---

## 🧪 Production Validation

### Health Check Endpoint

Create `backend/routes/health.js`:
```javascript
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024
      }
    }
  };

  res.status(200).json(health);
});

module.exports = router;
```

Test:
```bash
curl https://api.jaffna-restaurant.lk/health
```

Expected response:
```json
{
  "uptime": 12345.67,
  "timestamp": 1697654400000,
  "status": "ok",
  "services": {
    "database": "connected",
    "memory": {
      "used": 145.23,
      "total": 256.00
    }
  }
}
```

---

## 🔒 Security Checklist

- [ ] Environment variables set correctly
- [ ] MongoDB authentication enabled
- [ ] SSL certificates installed and auto-renewing
- [ ] Firewall configured (UFW or iptables)
- [ ] SSH key-only authentication
- [ ] Rate limiting enabled
- [ ] CORS whitelist configured
- [ ] Helmet.js security headers
- [ ] Input validation on all endpoints
- [ ] File upload size limits
- [ ] PayHere IP whitelist
- [ ] Regular security audits (`npm audit`)

---

## 📈 Performance Optimization

### 1. Database Connection Pooling

```javascript
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  family: 4
});
```

### 2. Redis Caching (Optional)

```javascript
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

// Cache menu items
const cacheKey = `menu:${category}:${page}`;
const cached = await client.get(cacheKey);
if (cached) return JSON.parse(cached);

// Query database
const menuItems = await MenuItem.find({ category });
await client.setex(cacheKey, 3600, JSON.stringify(menuItems));
```

### 3. Image Optimization

- Use WebP format for modern browsers
- Implement lazy loading for menu images
- Use responsive images (`srcset`)
- CDN distribution via Cloudinary

---

## 🚨 Troubleshooting

### Issue: MongoDB connection timeout

**Solution**:
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check logs
tail -f /var/log/mongodb/mongod.log
```

### Issue: PM2 app crashes on startup

**Solution**:
```bash
# Check logs
pm2 logs jaffna-food-api --lines 100

# Restart with fresh environment
pm2 delete jaffna-food-api
pm2 start ecosystem.config.js --env production
```

### Issue: Nginx 502 Bad Gateway

**Solution**:
```bash
# Check if Node.js is running
pm2 status

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Test proxy connection
curl http://localhost:5000/health
```

---

## 📞 Support & Maintenance

### Backup Strategy

**Daily MongoDB Backups**:
```bash
# Create cron job
0 2 * * * mongodump --uri="mongodb://localhost:27017/jaffna_food_production" --out="/backup/mongodb/$(date +\%Y\%m\%d)"
```

**Weekly Code Backups**:
```bash
# Create Git tag
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

### Update Process

1. Test changes in staging environment
2. Create database backup
3. Deploy during low-traffic hours (2-4 AM)
4. Monitor logs for 15 minutes post-deployment
5. Rollback if errors detected

---

**Last Updated**: October 18, 2025  
**Version**: 1.0  
**Contact**: dev@jaffna-restaurant.lk
