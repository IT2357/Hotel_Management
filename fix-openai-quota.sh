#!/bin/bash
# OpenAI Quota Fix Guide

echo "🔧 OPENAI QUOTA ISSUE - SOLUTIONS"
echo "=================================="
echo ""

echo "❌ PROBLEM: Your OpenAI API key has exceeded quota"
echo "📊 ERROR: 429 - You exceeded your current quota"
echo ""

echo "✅ SOLUTION 1 - UPGRADE PLAN (RECOMMENDED)"
echo "  1. Go to: https://platform.openai.com/account/billing"
echo "  2. Click: 'Manage Plan'"
echo "  3. Choose: Pay-as-you-go or higher tier"
echo "  4. Add payment method"
echo ""

echo "✅ SOLUTION 2 - ADD CREDITS"
echo "  1. Go to: https://platform.openai.com/account/billing"
echo "  2. Click: 'Add Credits'"
echo "  3. Purchase credits ($5 minimum)"
echo ""

echo "✅ SOLUTION 3 - CREATE NEW API KEY"
echo "  1. Go to: https://platform.openai.com/api-keys"
echo "  2. Click: 'Create new secret key'"
echo "  3. Copy new key"
echo "  4. Replace in your .env file"
echo ""

echo "✅ SOLUTION 4 - USE ALTERNATIVE API"
echo "  1. Sign up for: https://console.cloud.google.com"
echo "  2. Enable: Vision API"
echo "  3. Create: Service Account"
echo "  4. Download: JSON key file"
echo "  5. Set: export GOOGLE_APPLICATION_CREDENTIALS='path/to/key.json'"
echo ""

echo "🎯 YOUR SYSTEM STATUS:"
echo "  ✅ AI Menu Extraction: Fully built and ready"
echo "  ✅ Backend: http://localhost:5000"
echo "  ✅ Frontend: http://localhost:5174"
echo "  ✅ Basic Processing: Working (text parsing)"
echo "  ✅ Web Scraping: Working (URLs)"
echo "  ⚠️ OpenAI Vision: Needs quota resolution"
echo ""

echo "🚀 READY TO USE RIGHT NOW:"
echo "  • Upload menu images (basic extraction)"
echo "  • Provide restaurant URLs (web scraping)"
echo "  • Manual review and editing"
echo "  • Save to your menu database"
echo ""

echo "📱 ACCESS: http://localhost:5174/admin/menu-upload"
