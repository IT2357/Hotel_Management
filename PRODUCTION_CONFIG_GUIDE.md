# Production Configuration Guide

This guide helps you configure all optional services for production deployment.

## 🔐 Required Services

### 1. Google Vision API (for AI Menu Extraction)

**Steps to Configure:**

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create a new project or select existing one
   - Enable the Vision API

2. **Create Service Account**
   - Navigate to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Name: "hotel-vision-api"
   - Grant role: "Cloud Vision API User"
   - Click "Done"

3. **Generate Credentials**
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download the file

4. **Install Credentials**
   ```bash
   # Copy downloaded JSON to backend/config/
   cp ~/Downloads/your-credentials.json backend/config/google-credentials.json
   ```

5. **Update .env**
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   ```

**Features Enabled:**
- ✅ AI-powered menu extraction from images
- ✅ OCR for menu text recognition
- ✅ Automatic menu item detection

---

## 📧 Email Configuration (SMTP)

**For Gmail:**

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" (name it "Hotel Management")
   - Copy the 16-character password

3. **Update .env**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

**For Other Providers:**

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

**Features Enabled:**
- ✅ Email verification for new users
- ✅ Password reset emails
- ✅ Booking confirmations
- ✅ Order notifications
- ✅ Admin alerts

---

## 🔵 Facebook OAuth Configuration

**Steps:**

1. **Create Facebook App**
   - Go to https://developers.facebook.com/apps
   - Click "Create App"
   - Select "Consumer" type
   - Fill in app details

2. **Configure OAuth**
   - Go to Settings > Basic
   - Add "Facebook Login" product
   - Configure redirect URIs:
     - http://localhost:5000/api/auth/facebook/callback (development)
     - https://your-domain.com/api/auth/facebook/callback (production)

3. **Get Credentials**
   - Copy App ID
   - Copy App Secret

4. **Update .env**
   ```env
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback
   ```

**Features Enabled:**
- ✅ Social login with Facebook
- ✅ Quick guest registration
- ✅ Profile photo import

---

## ☁️ Cloudinary Configuration (Image Storage)

**Steps:**

1. **Create Cloudinary Account**
   - Go to https://cloudinary.com
   - Sign up for free account
   - Get 25GB free storage

2. **Get Credentials**
   - Go to Dashboard
   - Copy Cloud Name
   - Copy API Key
   - Copy API Secret

3. **Update .env**
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Set Storage Provider**
   ```env
   IMAGE_STORAGE_PROVIDER=cloudinary  # or 'gridfs' for MongoDB
   ```

**Features Enabled:**
- ✅ Fast image uploads
- ✅ Automatic image optimization
- ✅ CDN delivery
- ✅ Image transformations
- ✅ Better performance

---

## 💬 Twilio SMS Configuration (Optional)

**Steps:**

1. **Create Twilio Account**
   - Go to https://www.twilio.com
   - Sign up for account
   - Get free trial credits

2. **Get Credentials**
   - Go to Console Dashboard
   - Copy Account SID
   - Copy Auth Token
   - Get a phone number

3. **Update .env**
   ```env
   SMS_ENABLED=true
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

**Features Enabled:**
- ✅ SMS notifications for bookings
- ✅ SMS verification codes
- ✅ Order status updates
- ✅ Emergency alerts

---

## 🔒 Security Configuration

### JWT Secret
Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Update .env:
```env
JWT_SECRET=your-generated-secret
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
```

### Encryption Key
Generate encryption key (32 bytes):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update .env:
```env
ENCRYPTION_KEY=your-generated-encryption-key
```

---

## 🌐 CORS Configuration

**For Production:**
```env
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
```

**For Development:**
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

---

## 💾 Database Configuration

### MongoDB Atlas (Production)

1. **Create Cluster**
   - Go to https://cloud.mongodb.com
   - Create free cluster
   - Add database user
   - Whitelist IP addresses

2. **Get Connection String**
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hotel_management?retryWrites=true&w=majority
   ```

3. **Update .env**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel_management
   ```

### MongoDB Local (Development)
```env
MONGO_URI=mongodb://localhost:27017/hotel_management
```

---

## 📊 Redis Configuration (Optional - for caching)

**Local Redis:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Redis Cloud:**
```env
REDIS_HOST=redis-xxxxx.cloud.redislabs.com
REDIS_PORT=xxxxx
REDIS_PASSWORD=your-redis-password
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database backups configured
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Email service tested
- [ ] Payment gateway tested (if applicable)
- [ ] Error logging configured (Sentry, LogRocket, etc.)

### Environment Variables Template
Copy this to your `.env.production`:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel_management

# JWT & Security
JWT_SECRET=your-strong-jwt-secret-here
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
ENCRYPTION_KEY=your-32-byte-encryption-key

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Google Vision API
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
IMAGE_STORAGE_PROVIDER=cloudinary

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=https://your-domain.com/api/auth/facebook/callback

# Twilio SMS (Optional)
SMS_ENABLED=true
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com

# Redis (Optional)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

---

## 🧪 Testing Configuration

After configuring, test each service:

### Test Email
```bash
curl -X POST http://localhost:5000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test"}'
```

### Test Google Vision
```bash
curl -X POST http://localhost:5000/api/menu/extract/test
```

### Test SMS
```bash
curl -X POST http://localhost:5000/api/test/sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Test"}'
```

### Test Cloudinary
```bash
curl -X POST http://localhost:5000/api/test/upload \
  -F "image=@test-image.jpg"
```

---

## 🐛 Troubleshooting

### Gmail SMTP Error
**Error:** "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solutions:**
1. Enable 2-Factor Authentication
2. Generate App Password (not your regular password)
3. Check "Less secure app access" is OFF (use App Password instead)
4. Verify email and password in .env

### Google Vision Error
**Error:** "Credentials file not found"

**Solutions:**
1. Verify file exists at: `backend/config/google-credentials.json`
2. Check file permissions: `chmod 600 google-credentials.json`
3. Verify path in .env matches file location
4. Ensure JSON file is valid (no syntax errors)

### Facebook OAuth Error
**Error:** "Redirect URI mismatch"

**Solutions:**
1. Add callback URL to Facebook App settings
2. Ensure URL matches exactly (including http/https)
3. For localhost, use http://localhost:5000 not 127.0.0.1
4. Wait a few minutes for Facebook to update settings

### Cloudinary Error
**Error:** "Upload failed"

**Solutions:**
1. Verify API credentials are correct
2. Check cloud name doesn't have typos
3. Ensure image size is under limit
4. Verify account has remaining storage quota

---

## 📞 Support Resources

- **Google Cloud Support:** https://cloud.google.com/support
- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Facebook Developers:** https://developers.facebook.com/support
- **Twilio Support:** https://support.twilio.com
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas/support

---

## 🎯 Quick Start Commands

```bash
# Install all dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Run database migrations
npm run migrate

# Seed database (optional)
npm run seed

# Start development server
npm run dev

# Start production server
npm start
```

---

*Last Updated: 2025-10-15*
*For issues or questions, check the troubleshooting section above.*
