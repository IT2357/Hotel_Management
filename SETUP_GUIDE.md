# Hotel Management System - Setup Guide

## 🚀 Quick Setup for Menu Management Features

This guide will help you configure the required services to fix the menu management issues.

## 📋 Issues Fixed

✅ **Cloudinary Configuration** - Updated environment variables with proper placeholders
✅ **API Endpoint Issues** - Verified backend routes are properly configured
✅ **AI Services Configuration** - Added setup instructions for Google AI services
✅ **Image Storage Provider Alignment** - Aligned frontend/backend to use Cloudinary

## 🔧 Required Services Setup

### 1. Cloudinary Setup (For Image Uploads)

1. **Create Account**: Go to [https://cloudinary.com](https://cloudinary.com) and create a free account
2. **Get Credentials**: After login, go to your Dashboard
3. **Update Environment Variables**:

**Frontend (.env)**:
```bash
VITE_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

**Backend (.env)**:
```bash
CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
CLOUDINARY_API_KEY=your-actual-api-key
CLOUDINARY_API_SECRET=your-actual-api-secret
```

4. **Create Upload Preset**:
   - Go to Settings > Upload
   - Create a new upload preset called "menu-items"
   - Set Mode to "Unsigned" for frontend uploads

### 2. Google AI Setup (For Menu Extraction)

1. **Get Google AI API Key**: Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. **Create API Key**: Click "Create API Key" and copy it
3. **Update Backend Environment**:

```bash
GOOGLE_AI_API_KEY=your-actual-google-ai-api-key
GEMINI_API_KEY=your-actual-google-ai-api-key
```

### 3. Google Cloud Vision Setup (Optional - For OCR)

1. **Create Google Cloud Project**: Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. **Enable Vision API**: Search for "Vision API" and enable it
3. **Create Service Account**: Go to IAM & Admin > Service Accounts
4. **Download Credentials**: Download the JSON key file
5. **Update Backend Environment**:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

## 🧪 Testing the Fixes

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd backend && npm install && npm start

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev
```

### 2. Test Menu Management

1. **Login as Admin**: Go to `/admin` and login
2. **Navigate to Menu Management**: Go to the menu management section
3. **Test Image Upload**: Try uploading an image - should work with Cloudinary
4. **Test Menu Items**: Try creating/editing menu items
5. **Test AI Extractor**: Upload a menu image to test AI extraction

### 3. Check Console Logs

The application now includes comprehensive debug logs. Check:

- **Browser Console**: For frontend Cloudinary and API errors
- **Backend Terminal**: For server-side configuration and API logs
- **Network Tab**: For API request/response details

## 🔍 Debug Information

### Common Issues & Solutions

#### Issue: "Cloudinary not configured"
**Solution**: Check that all Cloudinary environment variables are set with actual values (not placeholders)

#### Issue: "AI service not available"
**Solution**: Ensure Google AI API key is properly configured in backend/.env

#### Issue: "Menu items not loading"
**Solution**: Check backend logs for database connection and API endpoint errors

#### Issue: "Image upload fails"
**Solution**: Verify Cloudinary credentials and upload preset configuration

### Debug Commands

```bash
# Check if backend is running
curl http://localhost:5000/health

# Check API endpoints
curl http://localhost:5000/api/food/menu/items

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/food/menu/items
```

## 📝 Environment Variables Summary

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/hotel_management

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
CLOUDINARY_API_KEY=your-actual-api-key
CLOUDINARY_API_SECRET=your-actual-api-secret
IMAGE_STORAGE_PROVIDER=cloudinary

# AI Services
GOOGLE_AI_API_KEY=your-actual-google-ai-api-key
GEMINI_API_KEY=your-actual-google-ai-api-key

# Optional - Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

## 🎯 Next Steps

1. **Configure Services**: Follow the setup instructions above
2. **Test Features**: Try all menu management features
3. **Check Logs**: Monitor console and server logs for any remaining issues
4. **Contact Support**: If issues persist, check the debug logs for specific error messages

## 📞 Support

If you encounter issues:
1. Check the browser console for frontend errors
2. Check the backend terminal for server errors
3. Verify all environment variables are properly set
4. Ensure all required services (Cloudinary, Google AI) are configured

The system now includes comprehensive error handling and logging to help identify any remaining configuration issues.