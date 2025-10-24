#!/bin/bash

# 🧠 AI Vision Setup Script
# This script helps you enable Google Lens-like menu extraction

echo "🧠 AI Vision Setup for Menu Extraction"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env file..."
    touch .env
fi

echo "📋 Choose AI Provider:"
echo "1. Gemini (Google) - FREE tier, recommended"
echo "2. OpenAI (GPT-4 Vision) - Paid, high accuracy"
echo "3. Mock (Testing only, no real AI)"
echo ""

read -p "Enter choice (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "🔑 Setting up Gemini Vision..."
        echo ""
        echo "Please get your FREE Gemini API key:"
        echo "👉 https://makersuite.google.com/app/apikey"
        echo ""
        read -p "Enter your Gemini API key (starts with AIza...): " api_key
        
        if [ -z "$api_key" ]; then
            echo "❌ No API key provided!"
            exit 1
        fi
        
        # Check if AI settings already exist
        if grep -q "AI_PROVIDER" .env; then
            # Update existing
            sed -i.bak 's/^AI_PROVIDER=.*/AI_PROVIDER=gemini/' .env
            sed -i.bak 's/^GEMINI_API_KEY=.*/GEMINI_API_KEY='"$api_key"'/' .env
            echo "✅ Updated existing AI configuration"
        else
            # Add new
            echo "" >> .env
            echo "# AI Vision Configuration" >> .env
            echo "AI_PROVIDER=gemini" >> .env
            echo "GEMINI_API_KEY=$api_key" >> .env
            echo "✅ Added AI configuration to .env"
        fi
        
        echo ""
        echo "🎉 Gemini Vision enabled!"
        echo ""
        echo "📊 What you can now do:"
        echo "  ✅ Upload ANY food image → AI recognizes dish"
        echo "  ✅ Upload menu photos → Extract all items"
        echo "  ✅ Upload website screenshots → Full menu extraction"
        echo ""
        ;;
        
    2)
        echo ""
        echo "🔑 Setting up OpenAI Vision..."
        echo ""
        echo "Please get your OpenAI API key:"
        echo "👉 https://platform.openai.com/api-keys"
        echo ""
        read -p "Enter your OpenAI API key (starts with sk-...): " api_key
        
        if [ -z "$api_key" ]; then
            echo "❌ No API key provided!"
            exit 1
        fi
        
        if grep -q "AI_PROVIDER" .env; then
            sed -i.bak 's/^AI_PROVIDER=.*/AI_PROVIDER=openai/' .env
            sed -i.bak 's/^OPENAI_API_KEY=.*/OPENAI_API_KEY='"$api_key"'/' .env
            echo "✅ Updated existing AI configuration"
        else
            echo "" >> .env
            echo "# AI Vision Configuration" >> .env
            echo "AI_PROVIDER=openai" >> .env
            echo "OPENAI_API_KEY=$api_key" >> .env
            echo "✅ Added AI configuration to .env"
        fi
        
        echo ""
        echo "🎉 OpenAI Vision enabled!"
        echo ""
        ;;
        
    3)
        echo ""
        echo "🧪 Enabling Mock Mode (Testing)..."
        
        if grep -q "AI_PROVIDER" .env; then
            sed -i.bak 's/^AI_PROVIDER=.*/AI_PROVIDER=mock/' .env
        else
            echo "" >> .env
            echo "# AI Vision Configuration" >> .env
            echo "AI_PROVIDER=mock" >> .env
        fi
        
        echo "✅ Mock mode enabled (no real AI, for testing only)"
        echo ""
        ;;
        
    *)
        echo "❌ Invalid choice!"
        exit 1
        ;;
esac

echo "🔄 Restarting backend server..."
echo ""

# Kill existing process
pkill -f "node.*server.js"
sleep 2

# Start new process in background
npm start > /dev/null 2>&1 &

echo "✅ Backend restarted!"
echo ""
echo "🎯 Next steps:"
echo "1. Go to Admin → AI Menu Extractor"
echo "2. Upload ANY image:"
echo "   - Food photos"
echo "   - Menu boards"
echo "   - Website screenshots"
echo "3. Watch AI extract menu items automatically!"
echo ""
echo "📖 Full guide: ../ENABLE_AI_VISION_GUIDE.md"
echo ""
echo "✨ AI Vision is now active! Try uploading that dosa image again! 🚀"

